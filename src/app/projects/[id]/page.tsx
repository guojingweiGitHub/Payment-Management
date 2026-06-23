"use client";

import { useState, useEffect, use, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getProjectDetail, createContactRecord, updateProject, Project, ContactRecord } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FileDown, Upload, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import AppLayout from "@/components/ui/app-layout";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const isEditor = authUser?.role === 'admin' || authUser?.role === '编辑';
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 新增联系记录对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    contact_time: "",
    delay_reason: "",
    notes: ""
  });
  
  // 附件上传
  const [contactAttachments, setContactAttachments] = useState<Array<{key: string; name: string; type: string; size: number}>>([]);
  const [uploading, setUploading] = useState(false);
  const contactFileRef = useRef<HTMLInputElement>(null);
  
  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
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
    final_amount: "",
    payment_status: ""
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  useEffect(() => {
    loadProjectDetail();
  }, [resolvedParams.id]);
  
  const loadProjectDetail = async () => {
    setLoading(true);
    try {
      const result = await getProjectDetail(parseInt(resolvedParams.id));
      setProject(result.project);
      setContacts(result.contacts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
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
      
      setContactAttachments([...contactAttachments, result]);
      toast.success('文件上传成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
      if (contactFileRef.current) {
        contactFileRef.current.value = '';
      }
    }
  };
  
  const handleCreateContact = async () => {
    try {
      await createContactRecord(parseInt(resolvedParams.id), {
        ...contactForm,
        attachments: contactAttachments.length > 0 ? contactAttachments : undefined
      });
      toast.success("联系记录已添加");
      setDialogOpen(false);
      setContactForm({
        contact_time: "",
        delay_reason: "",
        notes: ""
      });
      setContactAttachments([]);
      loadProjectDetail();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "添加失败");
    }
  };
  
  // 生成Word文档
  const handleGenerateDoc = () => {
    toast.info('该功能开发中，敬请期待');
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };
  
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };
  
  const formatAmount = (amount: string | null) => {
    if (!amount) return "-";
    return `¥${parseFloat(amount).toLocaleString()}`;
  };
  
  const openEditDialog = () => {
    if (!project) return;
    setEditForm({
      pickup_date: project.pickup_date ? project.pickup_date.split('T')[0] : "",
      company_name: project.company_name || "",
      project_code: project.project_code || "",
      client_name: project.client_name || "",
      client_phone: project.client_phone || "",
      branch_leader_signature: project.branch_leader_signature || "",
      registrant: project.registrant || "",
      expected_payment_date: project.expected_payment_date ? project.expected_payment_date.split('T')[0] : "",
      project_manager: project.project_manager || "",
      contract_amount: project.contract_amount || "",
      final_amount: project.final_amount || "",
      payment_status: project.payment_status || "未缴费"
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!project) return;
    setEditSubmitting(true);
    try {
      await updateProject(project.id, editForm);
      toast.success("更新成功");
      setEditDialogOpen(false);
      loadProjectDetail();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setEditSubmitting(false);
    }
  };
  
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word')) return '📝';
    return '📎';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      </div>
  );
  }
  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Button variant="outline" onClick={() => router.push("/")} className="mb-4">
          返回列表
        </Button>
        
        {/* 项目详情 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>项目详情 - {project.project_code}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerateDoc}>
                  <FileDown className="h-4 w-4 mr-1" />
                  生成文档
                </Button>
                {isEditor && (
                <Button size="sm" variant="outline" onClick={openEditDialog}>
                  <Pencil className="h-4 w-4 mr-1" />
                  编辑
                </Button>
                )}
                <Badge variant={project.payment_status === "已缴费" ? "default" : "destructive"}>
                  {project.payment_status}
                </Badge>
                <Badge variant={project.is_expired ? "destructive" : "secondary"}>
                  {project.is_expired ? "已到期" : "未到期"}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 基本信息 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">拿图日期</Label>
                  <p className="text-lg font-medium">{formatDate(project.pickup_date)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">单位名称</Label>
                  <p className="text-lg font-medium">{project.company_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">工程编号</Label>
                  <p className="text-lg font-medium">{project.project_code}</p>
                </div>
                <div>
                  <Label className="text-gray-400">甲方姓名</Label>
                  <p className="text-lg font-medium">{project.client_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">甲方电话</Label>
                  <p className="text-lg font-medium">{project.client_phone}</p>
                </div>
                <div>
                  <Label className="text-gray-400">登记人</Label>
                  <p className="text-lg font-medium">{project.registrant}</p>
                </div>
                <div>
                  <Label className="text-gray-400">预计缴费日期</Label>
                  <p className="text-lg font-medium">{formatDate(project.expected_payment_date)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">项目负责人</Label>
                  <p className="text-lg font-medium">{project.project_manager || "-"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">分院领导签字</Label>
                  <p className="text-lg font-medium">{project.branch_leader_signature || "-"}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* 金额信息 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">金额信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">合同总额</Label>
                  <p className="text-lg font-medium">{formatAmount(project.contract_amount)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">决算金额</Label>
                  <p className="text-lg font-medium">{formatAmount(project.final_amount)}</p>
                </div>
              </div>
            </div>
            
            {/* 附件 */}
            {project.attachments && project.attachments.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">项目附件</h3>
                  <div className="space-y-2">
                    {project.attachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded">
                        <span className="flex items-center gap-2">
                          <span>{getFileIcon(att.type)}</span>
                          <span className="text-sm">{att.name}</span>
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={async () => {
                            const response = await fetch(`/api/upload?key=${att.key}`);
                            const data = await response.json();
                            if (data.url) {
                              window.open(data.url, '_blank');
                            }
                          }}
                        >
                          查看
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* 编辑对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑项目 - {project.project_code}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_pickup_date">拿图日期 *</Label>
                <Input id="edit_pickup_date" type="date" value={editForm.pickup_date}
                  onChange={(e) => setEditForm({...editForm, pickup_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_company_name">单位名称 *</Label>
                <Input id="edit_company_name" value={editForm.company_name}
                  onChange={(e) => setEditForm({...editForm, company_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_project_code">工程编号 *</Label>
                <Input id="edit_project_code" value={editForm.project_code}
                  onChange={(e) => setEditForm({...editForm, project_code: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_client_name">甲方姓名 *</Label>
                <Input id="edit_client_name" value={editForm.client_name}
                  onChange={(e) => setEditForm({...editForm, client_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_client_phone">甲方电话 *</Label>
                <Input id="edit_client_phone" value={editForm.client_phone}
                  onChange={(e) => setEditForm({...editForm, client_phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_registrant">登记人 *</Label>
                <Input id="edit_registrant" value={editForm.registrant}
                  onChange={(e) => setEditForm({...editForm, registrant: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_expected_date">预计缴费日期 *</Label>
                <Input id="edit_expected_date" type="date" value={editForm.expected_payment_date}
                  onChange={(e) => setEditForm({...editForm, expected_payment_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_project_manager">项目负责人</Label>
                <Input id="edit_project_manager" value={editForm.project_manager}
                  onChange={(e) => setEditForm({...editForm, project_manager: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_contract_amount">合同总额</Label>
                <Input id="edit_contract_amount" type="number" step="0.01" value={editForm.contract_amount}
                  onChange={(e) => setEditForm({...editForm, contract_amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_final_amount">决算金额</Label>
                <Input id="edit_final_amount" type="number" step="0.01" value={editForm.final_amount}
                  onChange={(e) => setEditForm({...editForm, final_amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_branch_leader">分院领导签字</Label>
                <Input id="edit_branch_leader" value={editForm.branch_leader_signature}
                  onChange={(e) => setEditForm({...editForm, branch_leader_signature: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_payment_status">缴费状态</Label>
                <Select value={editForm.payment_status} onValueChange={(v) => setEditForm({...editForm, payment_status: v})}>
                  <SelectTrigger id="edit_payment_status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未缴费">未缴费</SelectItem>
                    <SelectItem value="已缴费">已缴费</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
              <Button onClick={handleUpdate} disabled={editSubmitting}>
                {editSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* 联系记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>联系记录</span>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">新增联系记录</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新增联系记录</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_time">联系时间 *</Label>
                      <Input 
                        id="contact_time" 
                        type="datetime-local" 
                        value={contactForm.contact_time}
                        onChange={(e) => setContactForm({...contactForm, contact_time: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delay_reason">延期说明</Label>
                      <Textarea 
                        id="delay_reason"
                        value={contactForm.delay_reason}
                        onChange={(e) => setContactForm({...contactForm, delay_reason: e.target.value})}
                        placeholder="填写延期缴费的原因..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">备注</Label>
                      <Textarea 
                        id="notes"
                        value={contactForm.notes}
                        onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                        placeholder="其他备注信息..."
                      />
                    </div>
                    {/* 附件上传 */}
                    <div className="space-y-2">
                      <Label>附件上传</Label>
                      <Input 
                        ref={contactFileRef}
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <p className="text-xs text-gray-500">支持 PDF、图片、Word 文档</p>
                      {contactAttachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {contactAttachments.map((att, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                              <span className="text-sm truncate">{getFileIcon(att.type)} {att.name}</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setContactAttachments(contactAttachments.filter((_, i) => i !== index))}
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
                      setContactAttachments([]);
                    }}>取消</Button>
                    <Button onClick={handleCreateContact} disabled={uploading}>保存</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暂无联系记录</div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {formatDateTime(contact.contact_time)}
                      </span>
                    </div>
                    {contact.delay_reason && (
                      <div className="mb-2">
                        <Label className="text-gray-500 text-sm">延期说明</Label>
                        <p className="mt-1">{contact.delay_reason}</p>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="mb-2">
                        <Label className="text-gray-500 text-sm">备注</Label>
                        <p className="mt-1">{contact.notes}</p>
                      </div>
                    )}
                    {contact.attachments && contact.attachments.length > 0 && (
                      <div className="mt-3">
                        <Label className="text-gray-500 text-sm">附件</Label>
                        <div className="mt-2 space-y-1">
                          {contact.attachments.map((att, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                              <span className="text-sm truncate">{getFileIcon(att.type)} {att.name}</span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={async () => {
                                  const response = await fetch(`/api/upload?key=${att.key}`);
                                  const data = await response.json();
                                  if (data.url) {
                                    window.open(data.url, '_blank');
                                  }
                                }}
                              >
                                查看
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AppLayout>
  );
}