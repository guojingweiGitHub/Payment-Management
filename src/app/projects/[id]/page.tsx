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
import { getProjectDetail, createContactRecord, getReviewers, Project, ContactRecord, Reviewer } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FileDown, Upload } from "lucide-react";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  
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
  
  // 审核推送对话框
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  
  useEffect(() => {
    loadProjectDetail();
    loadReviewers();
  }, [resolvedParams.id]);
  
  const loadReviewers = async () => {
    try {
      const result = await getReviewers();
      setReviewers(result);
    } catch (error) {
      console.error('加载审核推送人失败:', error);
    }
  };
  
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
  
  const handleNotify = async () => {
    if (!selectedReviewer) {
      toast.error("请选择审核推送人");
      return;
    }
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName: selectedReviewer })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`已向 ${selectedReviewer} 发送审核通知`);
        setNotifyDialogOpen(false);
      } else {
        toast.error(data.error || "发送失败");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发送失败");
    }
  };
  
  // 生成Word文档
  const handleGenerateDoc = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}/generate-doc`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '生成失败');
      }
      
      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `项目_${project?.project_code}_收款单.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('文档已生成');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成失败');
    }
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
        <div className="text-gray-500">项目不存在</div>
      </div>
    );
  }
  
  return (
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
                <Badge variant={project.payment_status === "已缴费" ? "default" : "destructive"}>
                  {project.payment_status}
                </Badge>
                <Badge variant={project.is_expired ? "destructive" : "secondary"}>
                  {project.is_expired ? "已到期" : "未到期"}
                </Badge>
                <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">审核推送</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>审核推送</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Label>选择推送人</Label>
                      <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择审核推送人" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewers.length === 0 ? (
                            <SelectItem value="高庆强">高庆强</SelectItem>
                          ) : reviewers.map((r) => (
                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        将向选定的审核推送人发送项目审核通知
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>取消</Button>
                      <Button onClick={handleNotify}>发送</Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <Label className="text-gray-400">协议金额</Label>
                  <p className="text-lg font-medium">{formatAmount(project.agreement_amount)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">实际金额</Label>
                  <p className="text-lg font-medium">{formatAmount(project.actual_amount)}</p>
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
  );
}