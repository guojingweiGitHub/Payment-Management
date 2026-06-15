"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  getProjects, 
  createProject, 
  deleteProject, 
  updateProject,
  Project 
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Upload, FileDown, Percent } from "lucide-react";

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
    contract_amount: "",
    agreement_amount: "",
    actual_amount: "",
    final_amount: ""
  });
  
  // 附件上传
  const [attachments, setAttachments] = useState<Array<{key: string; name: string; type: string; size: number}>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // 批量导入对话框
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  // 批量打折对话框
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountRate, setDiscountRate] = useState("0.95");
  const [discountFields, setDiscountFields] = useState<string[]>(["agreement_amount", "actual_amount", "final_amount"]);
  const [discounting, setDiscounting] = useState(false);
  
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

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '上传失败');
      }
      
      setAttachments([...attachments, result]);
      toast.success('文件上传成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 移除附件
  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    try {
      await createProject({
        ...formData,
        attachments: attachments.length > 0 ? attachments : undefined
      });
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
        contract_amount: "",
        agreement_amount: "",
        actual_amount: "",
        final_amount: ""
      });
      setAttachments([]);
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

  // 批量选择处理
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(projects.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  // 批量导入处理
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('请选择要导入的文件');
      return;
    }
    
    setImporting(true);
    try {
      const formDataImport = new FormData();
      formDataImport.append('file', importFile);
      
      const response = await fetch('/api/projects/batch-import', {
        method: 'POST',
        body: formDataImport
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '导入失败');
      }
      
      toast.success(`导入完成：成功 ${result.inserted} 条，跳过 ${result.skipped} 条`);
      if (result.errors && result.errors.length > 0) {
        console.warn('导入错误:', result.errors);
      }
      
      setImportDialogOpen(false);
      setImportFile(null);
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
      loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 批量打折处理
  const handleDiscount = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要打折的项目');
      return;
    }
    
    setDiscounting(true);
    try {
      const response = await fetch('/api/projects/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          discount_rate: parseFloat(discountRate),
          fields: discountFields
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '打折失败');
      }
      
      toast.success(`批量打折完成：更新 ${result.updated} 条`);
      setDiscountDialogOpen(false);
      setSelectedIds([]);
      loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '打折失败');
    } finally {
      setDiscounting(false);
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
              <div className="flex gap-2">
                {/* 批量导入 */}
                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      批量导入
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>批量导入台账</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label>选择 Excel 文件</Label>
                        <Input 
                          ref={importFileRef}
                          type="file" 
                          accept=".xlsx,.xls"
                          onChange={handleImportFileSelect}
                        />
                      </div>
                      {importFile && (
                        <p className="text-sm text-gray-600">已选择: {importFile.name}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        支持字段：拿图日期、单位名称、工程编号、甲方姓名、甲方电话、分院领导签字、登记人、预计缴费日期、项目负责人、合同总额、协议金额、实际金额、决算金额
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setImportDialogOpen(false)}>取消</Button>
                      <Button onClick={handleImport} disabled={importing}>
                        {importing ? '导入中...' : '开始导入'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* 批量打折 */}
                <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
                      <Percent className="h-4 w-4 mr-1" />
                      批量打折 ({selectedIds.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>批量打折</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label>折扣比例</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          max="1"
                          value={discountRate}
                          onChange={(e) => setDiscountRate(e.target.value)}
                          placeholder="如 0.95 表示95%"
                        />
                        <p className="text-xs text-gray-500">0.95 表示按95%计算（即打折5%）</p>
                      </div>
                      <div className="space-y-2">
                        <Label>打折字段</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="agreement"
                              checked={discountFields.includes("agreement_amount")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDiscountFields([...discountFields, "agreement_amount"]);
                                } else {
                                  setDiscountFields(discountFields.filter(f => f !== "agreement_amount"));
                                }
                              }}
                            />
                            <label htmlFor="agreement" className="text-sm">协议金额</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="actual"
                              checked={discountFields.includes("actual_amount")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDiscountFields([...discountFields, "actual_amount"]);
                                } else {
                                  setDiscountFields(discountFields.filter(f => f !== "actual_amount"));
                                }
                              }}
                            />
                            <label htmlFor="actual" className="text-sm">实际金额</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="final"
                              checked={discountFields.includes("final_amount")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDiscountFields([...discountFields, "final_amount"]);
                                } else {
                                  setDiscountFields(discountFields.filter(f => f !== "final_amount"));
                                }
                              }}
                            />
                            <label htmlFor="final" className="text-sm">决算金额</label>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">将对选中的 {selectedIds.length} 个项目进行打折处理</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>取消</Button>
                      <Button onClick={handleDiscount} disabled={discounting}>
                        {discounting ? '处理中...' : '确认打折'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* 新增申请 */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>新增申请</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        <Label htmlFor="project_manager">项目负责人</Label>
                        <Input 
                          id="project_manager" 
                          value={formData.project_manager}
                          onChange={(e) => setFormData({...formData, project_manager: e.target.value})}
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
                        <Label htmlFor="agreement_amount">协议金额</Label>
                        <Input 
                          id="agreement_amount" 
                          type="number" 
                          step="0.01"
                          value={formData.agreement_amount}
                          onChange={(e) => setFormData({...formData, agreement_amount: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actual_amount">实际金额</Label>
                        <Input 
                          id="actual_amount" 
                          type="number" 
                          step="0.01"
                          value={formData.actual_amount}
                          onChange={(e) => setFormData({...formData, actual_amount: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="final_amount">决算金额</Label>
                        <Input 
                          id="final_amount" 
                          type="number" 
                          step="0.01"
                          value={formData.final_amount}
                          onChange={(e) => setFormData({...formData, final_amount: e.target.value})}
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
                      {/* 附件上传 */}
                      <div className="col-span-2 space-y-2">
                        <Label>附件上传</Label>
                        <Input 
                          ref={fileInputRef}
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <p className="text-xs text-gray-500">支持 PDF、图片、Word 文档，最大 10MB</p>
                        {attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {attachments.map((att, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                                <span className="text-sm truncate">{att.name}</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleRemoveAttachment(index)}
                                >
                                  移除
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setDialogOpen(false);
                        setAttachments([]);
                      }}>取消</Button>
                      <Button onClick={handleCreate} disabled={uploading}>提交</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                    <th className="px-2 py-3 text-left">
                      <Checkbox 
                        checked={selectedIds.length === projects.length && projects.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">工程编号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">单位名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">甲方</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">拿图日期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">预计缴费</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">合同总额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">协议金额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">实际金额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">决算金额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">到期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">加载中...</td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                    </tr>
                  ) : projects.map((project) => (
                    <tr key={project.id} className="border-t hover:bg-gray-50">
                      <td className="px-2 py-3">
                        <Checkbox 
                          checked={selectedIds.includes(project.id)}
                          onCheckedChange={(checked) => handleSelectOne(project.id, checked as boolean)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">{project.project_code}</td>
                      <td className="px-4 py-3 text-sm">{project.company_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{project.client_name}</div>
                        <div className="text-xs text-gray-500">{project.client_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(project.pickup_date)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(project.expected_payment_date)}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(project.contract_amount)}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(project.agreement_amount)}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(project.actual_amount)}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(project.final_amount)}</td>
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
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  共 {total} 条，第 {page}/{totalPages} 页
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    上一页
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}