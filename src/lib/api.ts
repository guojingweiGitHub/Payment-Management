// API 工具函数

const API_BASE = '/api';

export interface Project {
  id: number;
  pickup_date: string;
  company_name: string;
  project_code: string;
  client_name: string;
  client_phone: string;
  branch_leader_signature: string | null;
  registrant: string;
  expected_payment_date: string;
  is_expired: boolean;
  project_manager: string | null;
  contract_amount: string | null;
  agreement_amount: string | null;
  actual_amount: string | null;
  final_amount: string | null;
  payment_status: string;
  attachments: Array<{key: string; name: string; type: string; size: number}> | null;
  created_at: string;
  updated_at: string | null;
}

export interface ContactRecord {
  id: number;
  project_id: number;
  contact_time: string;
  delay_reason: string | null;
  notes: string | null;
  attachments: Array<{key: string; name: string; type: string; size: number}> | null;
  created_at: string;
}

export interface Reviewer {
  id: number;
  name: string;
  created_at: string;
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectDetailResponse {
  project: Project;
  contacts: ContactRecord[];
}

// 获取项目列表
export async function getProjects(params: {
  project_code?: string;
  company_name?: string;
  client_phone?: string;
  payment_status?: string;
  is_expired?: string;
  pickup_date_from?: string;
  pickup_date_to?: string;
  expected_date_from?: string;
  expected_date_to?: string;
  days_before_expired?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProjectListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'all') searchParams.set(key, value.toString());
  });
  
  const response = await fetch(`${API_BASE}/projects?${searchParams.toString()}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '获取项目列表失败');
  }
  
  return data;
}

// 新增项目
export async function createProject(project: {
  pickup_date: string;
  company_name: string;
  project_code: string;
  client_name: string;
  client_phone: string;
  branch_leader_signature?: string;
  registrant: string;
  expected_payment_date: string;
  project_manager?: string;
  contract_amount?: string;
  agreement_amount?: string;
  actual_amount?: string;
  final_amount?: string;
  attachments?: Array<{key: string; name: string; type: string; size: number}>;
}): Promise<Project> {
  const response = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '新增项目失败');
  }
  
  return data.data;
}

// 获取项目详情
export async function getProjectDetail(id: number): Promise<ProjectDetailResponse> {
  const response = await fetch(`${API_BASE}/projects/${id}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '获取项目详情失败');
  }
  
  return data;
}

// 更新项目
export async function updateProject(id: number, project: Partial<Project>): Promise<Project> {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '更新项目失败');
  }
  
  return data.data;
}

// 删除项目
export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '删除项目失败');
  }
}

// 新增联系记录
export async function createContactRecord(projectId: number, record: {
  contact_time: string;
  delay_reason?: string;
  notes?: string;
  attachments?: Array<{key: string; name: string; type: string; size: number}>;
}): Promise<ContactRecord> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '新增联系记录失败');
  }
  
  return data.data;
}

// 获取审核推送人列表
export async function getReviewers(): Promise<Reviewer[]> {
  const response = await fetch(`${API_BASE}/reviewers`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '获取审核推送人失败');
  }
  
  return data.data;
}