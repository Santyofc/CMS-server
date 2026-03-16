export type RoleKey = "superadmin" | "owner" | "admin" | "editor" | "reviewer" | "publisher" | "operator" | "viewer";

export type PermissionKey =
  | "read"
  | "edit"
  | "review"
  | "approve"
  | "commit"
  | "create_pr"
  | "publish"
  | "deploy"
  | "restart_service"
  | "view_logs"
  | "manage_repo"
  | "manage_adapter"
  | "manage_server"
  | "manage_domain"
  | "manage_users";

export type EnvironmentKey = "production" | "staging" | "development";
