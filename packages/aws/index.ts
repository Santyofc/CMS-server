import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  type Datapoint
} from "@aws-sdk/client-cloudwatch";
import {
  DescribeInstanceStatusCommand,
  DescribeInstancesCommand,
  EC2Client,
  RebootInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  type Instance,
  type Reservation
} from "@aws-sdk/client-ec2";

export type AwsEc2Instance = {
  instance_id: string;
  state: string;
  public_ip: string | null;
  private_ip: string | null;
  name: string | null;
  region: string;
  instance_type: string | null;
  availability_zone: string | null;
  launch_time: string | null;
  health: {
    system_status: string;
    instance_status: string;
  };
  tags: Record<string, string>;
};

export type AwsEc2MetricName =
  | "CPUUtilization"
  | "NetworkIn"
  | "NetworkOut"
  | "DiskReadOps"
  | "DiskWriteOps"
  | "StatusCheckFailed"
  | "CPUCreditBalance";

export type AwsMetricPoint = {
  metric: AwsEc2MetricName;
  timestamp: string;
  value: number;
  unit: string;
};

export type AwsInstanceHealth = {
  instance_id: string;
  system_status: string;
  instance_status: string;
  state: string;
};

export interface AwsProvider {
  listEc2Instances(): Promise<AwsEc2Instance[]>;
  getEc2Metrics(params: {
    instanceId: string;
    startTime: Date;
    endTime: Date;
    periodSeconds: number;
  }): Promise<AwsMetricPoint[]>;
  startInstance(instanceId: string): Promise<void>;
  stopInstance(instanceId: string): Promise<void>;
  rebootInstance(instanceId: string): Promise<void>;
  getInstanceHealth(instanceId: string): Promise<AwsInstanceHealth>;
}

function tagsToMap(instance: Instance): Record<string, string> {
  const tags = instance.Tags ?? [];
  const mapped: Record<string, string> = {};

  for (const tag of tags) {
    if (tag.Key && tag.Value) {
      mapped[tag.Key] = tag.Value;
    }
  }

  return mapped;
}

function resolveNameTag(tags: Record<string, string>): string | null {
  return tags.Name ?? null;
}

function flattenInstances(reservations: Reservation[] | undefined, region: string): AwsEc2Instance[] {
  if (!reservations) {
    return [];
  }

  return reservations.flatMap((reservation) => {
    return (reservation.Instances ?? []).map((instance) => {
      const tags = tagsToMap(instance);

      return {
        instance_id: instance.InstanceId ?? "unknown",
        state: instance.State?.Name ?? "unknown",
        public_ip: instance.PublicIpAddress ?? null,
        private_ip: instance.PrivateIpAddress ?? null,
        name: resolveNameTag(tags),
        region,
        instance_type: instance.InstanceType ?? null,
        availability_zone: instance.Placement?.AvailabilityZone ?? null,
        launch_time: instance.LaunchTime ? instance.LaunchTime.toISOString() : null,
        health: {
          system_status: "unknown",
          instance_status: "unknown"
        },
        tags
      };
    });
  });
}

function toSortedMetricPoints(metric: AwsEc2MetricName, points: Datapoint[] | undefined): AwsMetricPoint[] {
  return (points ?? [])
    .filter((point) => point.Timestamp && typeof point.Average === "number")
    .map((point) => ({
      metric,
      timestamp: point.Timestamp!.toISOString(),
      value: Number(point.Average),
      unit: point.Unit ?? "None"
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export class SdkAwsProvider implements AwsProvider {
  private readonly ec2: EC2Client;
  private readonly cloudwatch: CloudWatchClient;
  private readonly region: string;

  constructor(params: { region: string; accessKeyId: string; secretAccessKey: string }) {
    if (!params.region || !params.accessKeyId || !params.secretAccessKey) {
      throw new Error("AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required.");
    }

    this.region = params.region;
    this.ec2 = new EC2Client({
      region: params.region,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey
      }
    });

    this.cloudwatch = new CloudWatchClient({
      region: params.region,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey
      }
    });
  }

  async listEc2Instances(): Promise<AwsEc2Instance[]> {
    const instances: AwsEc2Instance[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.ec2.send(new DescribeInstancesCommand({ NextToken: nextToken }));
      instances.push(...flattenInstances(response.Reservations, this.region));
      nextToken = response.NextToken;
    } while (nextToken);

    const healthResponse = await this.ec2.send(new DescribeInstanceStatusCommand({
      IncludeAllInstances: true
    }));

    const healthById = new Map<string, { system_status: string; instance_status: string }>();
    for (const status of healthResponse.InstanceStatuses ?? []) {
      const id = status.InstanceId;
      if (!id) {
        continue;
      }

      healthById.set(id, {
        system_status: status.SystemStatus?.Status ?? "unknown",
        instance_status: status.InstanceStatus?.Status ?? "unknown"
      });
    }

    for (const instance of instances) {
      const health = healthById.get(instance.instance_id);
      if (health) {
        instance.health = health;
      }
    }

    return instances;
  }

  async getEc2Metrics(params: {
    instanceId: string;
    startTime: Date;
    endTime: Date;
    periodSeconds: number;
  }): Promise<AwsMetricPoint[]> {
    const metrics: AwsEc2MetricName[] = [
      "CPUUtilization",
      "NetworkIn",
      "NetworkOut",
      "DiskReadOps",
      "DiskWriteOps",
      "StatusCheckFailed",
      "CPUCreditBalance"
    ];

    const output: AwsMetricPoint[] = [];

    for (const metric of metrics) {
      const response = await this.cloudwatch.send(new GetMetricStatisticsCommand({
        Namespace: "AWS/EC2",
        MetricName: metric,
        Dimensions: [{ Name: "InstanceId", Value: params.instanceId }],
        StartTime: params.startTime,
        EndTime: params.endTime,
        Period: params.periodSeconds,
        Statistics: ["Average"]
      }));

      output.push(...toSortedMetricPoints(metric, response.Datapoints));
    }

    return output.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async startInstance(instanceId: string): Promise<void> {
    await this.ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
  }

  async stopInstance(instanceId: string): Promise<void> {
    await this.ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
  }

  async rebootInstance(instanceId: string): Promise<void> {
    await this.ec2.send(new RebootInstancesCommand({ InstanceIds: [instanceId] }));
  }

  async getInstanceHealth(instanceId: string): Promise<AwsInstanceHealth> {
    const response = await this.ec2.send(new DescribeInstanceStatusCommand({
      InstanceIds: [instanceId],
      IncludeAllInstances: true
    }));

    const status = response.InstanceStatuses?.[0];

    return {
      instance_id: instanceId,
      system_status: status?.SystemStatus?.Status ?? "unknown",
      instance_status: status?.InstanceStatus?.Status ?? "unknown",
      state: status?.InstanceState?.Name ?? "unknown"
    };
  }
}

export function createAwsProvider(env: NodeJS.ProcessEnv = process.env): AwsProvider {
  const region = env.AWS_REGION;
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required.");
  }

  return new SdkAwsProvider({ region, accessKeyId, secretAccessKey });
}
