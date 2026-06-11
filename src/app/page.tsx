"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  getProjects, 
  createProject, 
  deleteProject, 
  updateProject,
  Project 
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    project_code: "",
    company_name: "",
    client_phone: "",
    payment_status: "all",
    is_expired: "all",
    days_before_expired: ""
  });
  
  // 新增对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pickup_date: "",
    company_name: "",
    project_code: "",
    client_name: "",
    client_phone: "",
    branch_leader_signature: "",
    registrant: "",
    expected_payment_date: "",
    project_manager: "",
    contract_amount: ""
  });
  
  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  
  // 到期提醒
  const [reminders, setReminders] = useState<{
    total: number;
    reminders: Array<{
      registrant: string;
      total: number;
      expired: number;
      upcoming: number;
      projects: Array<{ id: number; project_code: string; company_name: string; expected_payment_date: string; is_expired: boolean }>;
    }>;
  } | null>(null);
  
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProjects({
        ...filters,
        page,
        pageSize
      });
      setProjects(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);
  
  const loadReminders = useCallback(async () => {
    try {
      const response = await fetch('/api/reminders?days=7');
      const data = await response.json();
      if (response.ok) {
        setReminders(data);
      }
    } catch (error) {
      console.error('加载提醒失败:', error);
    }
  }, []);
  
  useEffect(() => {
    loadProjects();
    loadReminders();
  }, [loadProjects, loadReminders]);
  
  const handleSearch = () => {
    setPage(1);
    loadProjects();
  };
  
  const handleReset = () => {
    setFilters({
      project_code: "",
      company_name: "",
      client_phone: "",
      payment_status: "all",
      is_expired: "all",
      days_before_expired: ""
    });
    setPage(1);
  };
  
  const handleCreate = async () => {
    try {
      await createProject(formData);
      toast.success("新增成功");
      setDialogOpen(false);
      setFormData({
        pickup_date: "",
        company_name: "",
        project_code: "",
        client_name: "",
        client_phone: "",
        branch_leader_signature: "",
        registrant: "",
        expected_payment_date: "",
        project_manager: "",
        contract_amount: ""
      });
      loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "新增失败");
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此项目吗？")) return;
    try {
      await deleteProject(id);
      toast.success("删除成功");
      loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  };
  
  const handleEdit = async () => {
    if (!editProject) return;
    try {
      await updateProject(editProject.id, {
        payment_status: editProject.payment_status,
        expected_payment_date: editProject.expected_payment_date
      });
      toast.success("更新成功");
      setEditDialogOpen(false);
      loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败");
    }
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };
  
  const formatAmount = (amount: string | null) => {
    if (!amount) return "-";
    return `¥${parseFloat(amount).toLocaleString()}`;
  };
  
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 到期提醒 */}
        {reminders && reminders.total > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Bell className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">到期提醒（7天内）</AlertTitle>
            <AlertDescription className="text-orange-700">
              共有 {reminders.total} 个项目即将到期或已到期，请及时跟进：
              {reminders.reminders.slice(0, 3).map((r, i) => (
                <span key={i} className="ml-2">
                  {r.registrant}({r.expired}已到期, {r.upcoming}即将到期)
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>未缴费拿图台账</span>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>新增申请</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新增项目申请</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup_date">拿图日期 *</Label>
                      <Input 
                        id="pickup_date" 
                        type="date" 
                        value={formData.pickup_date}
                        onChange={(e) => setFormData({...formData, pickup_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">单位名称 *</Label>
                      <Input 
                        id="company_name" 
                        value={formData.company_name}
                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_code">工程编号 *</Label>
                      <Input 
                        id="project_code" 
                        value={formData.project_code}
                        onChange={(e) => setFormData({...formData, project_code: e.target.value})}
                        placeholder="唯一编号，不可重复"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_name">甲方姓名 *</Label>
                      <Input 
                        id="client_name" 
                        value={formData.client_name}
                        onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_phone">甲方电话 *</Label>
                      <Input 
                        id="client_phone" 
                        value={formData.client_phone}
                        onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrant">登记人 *</Label>
                      <Input 
                        id="registrant" 
                        value={formData.registrant}
                        onChange={(e) => setFormData({...formData, registrant: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_payment_date">预计缴费日期 *</Label>
                      <Input 
                        id="expected_payment_date" 
                        type="date" 
                        value={formData.expected_payment_date}
                        onChange={(e) => setFormData({...formData, expected_payment_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contract_amount">合同总额</Label>
                      <Input 
                        id="contract_amount" 
                        type="number" 
                        step="0.01"
                        value={formData.contract_amount}
                        onChange={(e) => setFormData({...formData, contract_amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_manager">项目负责人</Label>
                      <Input 
                        id="project_manager" 
                        value={formData.project_manager}
                        onChange={(e) => setFormData({...formData, project_manager: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch_leader_signature">分院领导签字</Label>
                      <Input 
                        id="branch_leader_signature" 
                        value={formData.branch_leader_signature}
                        onChange={(e) => setFormData({...formData, branch_leader_signature: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                    <Button onClick={handleCreate}>提交</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 筛选栏 */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label>工程编号</Label>
                <Input 
                  placeholder="模糊查询" 
                  value={filters.project_code}
                  onChange={(e) => setFilters({...filters, project_code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>单位名称</Label>
                <Input 
                  placeholder="模糊查询" 
                  value={filters.company_name}
                  onChange={(e) => setFilters({...filters, company_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>甲方电话</Label>
                <Input 
                  placeholder="模糊查询" 
                  value={filters.client_phone}
                  onChange={(e) => setFilters({...filters, client_phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>缴费状态</Label>
                <Select 
                  value={filters.payment_status} 
                  onValueChange={(v) => setFilters({...filters, payment_status: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="未缴费">未缴费</SelectItem>
                    <SelectItem value="已缴费">已缴费</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>是否到期</Label>
                <Select 
                  value={filters.is_expired} 
                  onValueChange={(v) => setFilters({...filters, is_expired: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="true">已到期</SelectItem>
                    <SelectItem value="false">未到期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>临近到期（天内）</Label>
                <Input 
                  type="number" 
                  placeholder="如：7" 
                  value={filters.days_before_expired}
                  onChange={(e) => setFilters({...filters, days_before_expired: e.target.value})}
                />
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <Button onClick={handleSearch}>查询</Button>
                <Button variant="outline" onClick={handleReset}>重置</Button>
              </div>
            </div>
            
            {/* 数据表格 */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">工程编号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">单位名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">甲方姓名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">甲方电话</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">拿图日期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">预计缴费日期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">合同总额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">缴费状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">是否到期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">登记人</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500">加载中...</td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                    </tr>
                  ) : projects.map((project) => (
                    <tr key={project.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{project.project_code}</td>
                      <td className="px-4 py-3 text-sm">{project.company_name}</td>
                      <td className="px-4 py-3 text-sm">{project.client_name}</td>
                      <td className="px-4 py-3 text-sm">{project.client_phone}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(project.pickup_date)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(project.expected_payment_date)}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(project.contract_amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={project.payment_status === "已缴费" ? "default" : "destructive"}>
                          {project.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={project.is_expired ? "destructive" : "secondary"}>
                          {project.is_expired ? "已到期" : "未到期"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{project.registrant}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            详情
                          </Button>
                          <Dialog open={editDialogOpen && editProject?.id === project.id} onOpenChange={(open) => {
                            setEditDialogOpen(open);
                            if (open) setEditProject(project);
                            else setEditProject(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">编辑</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>编辑项目</DialogTitle>
                              </DialogHeader>
                              {editProject && (
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label>缴费状态</Label>
                                    <Select 
                                      value={editProject.payment_status} 
                                      onValueChange={(v) => setEditProject({...editProject, payment_status: v})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="未缴费">未缴费</SelectItem>
                                        <SelectItem value="已缴费">已缴费</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>预计缴费日期</Label>
                                    <Input 
                                      type="date" 
                                      value={editProject.expected_payment_date.split('T')[0]}
                                      onChange={(e) => setEditProject({...editProject, expected_payment_date: e.target.value})}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
                                <Button onClick={handleEdit}>保存</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDelete(project.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 分页 */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}