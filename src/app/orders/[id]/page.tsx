"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, Paperclip, Loader2, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const statusSteps = [
  { key: "Pending", label: "Pendiente de pago", color: "bg-orange-500" },
  { key: "Paid", label: "Pagado", color: "bg-green-500" },
  { key: "In Progress", label: "En progreso", color: "bg-blue-500" },
  { key: "Completed", label: "Completado", color: "bg-emerald-500" },
  { key: "Approved", label: "Aprobado", color: "bg-purple-500" },
];

const statusConfig: any = {
  Pending: { label: "Pendiente de pago", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado ✓", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
  Approved: { label: "Aprobado", color: "bg-purple-100 text-purple-700" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserRole = (session?.user as any)?.role;
  const isBuyer = currentUserRole === "buyer";
  const isSeller = currentUserRole === "seller";

  // Fetch data
  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
    fetchMessages();
    fetchFiles();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Orden no encontrada");
      const data = await res.json();
      setOrder(data.order || data);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Scroll to bottom
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
        toast.success("Mensaje enviado");
      } else {
        toast.error("No se pudo enviar el mensaje");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(`Subiendo ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/orders/${orderId}/files`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success(`✅ ${file.name} subido`, { id: toastId });
        fetchFiles();
      } else {
        toast.error("Error al subir archivo", { id: toastId });
      }
    } catch (err) {
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        toast.success(`Estado actualizado a ${newStatus}`);
      }
    } catch (err) {
      toast.error("No se pudo actualizar el estado");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Orden no encontrada</div>;
  }

  const currentStepIndex = statusSteps.findIndex((step) => step.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} /> Volver a mis órdenes
        </button>

        {/* Progress Stepper */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Progreso del servicio</h2>
            <div className="flex justify-between relative">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                      index <= currentStepIndex ? step.color : "bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className={`mt-3 text-xs sm:text-sm text-center ${index <= currentStepIndex ? "font-medium text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <Card>
              <CardContent className="p-8">
                <h1 className="text-3xl font-bold">{order.gig?.title}</h1>
                <p className="text-4xl font-bold text-orange-600 mt-3">
                  ${order.price?.toLocaleString("es-CO")} COP
                </p>
              </CardContent>
            </Card>

            {/* Role-based Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isSeller && order.status === "Paid" && (
                <>
                  <Button onClick={() => updateStatus("In Progress")} className="flex-1 py-7 text-lg">
                    Marcar como En Progreso
                  </Button>
                  <Button onClick={() => updateStatus("Completed")} variant="outline" className="flex-1 py-7 text-lg">
                    Marcar como Completado
                  </Button>
                </>
              )}

              {isBuyer && order.status === "Completed" && (
                <Button
                  onClick={() => updateStatus("Approved")}
                  className="w-full py-8 text-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  Aprobar Servicio y Liberar Pago
                </Button>
              )}
            </div>

            {/* Chat Section */}
            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6 flex items-center gap-3">
                  <MessageCircle size={24} /> Chat con {isBuyer ? "el vendedor" : "el comprador"}
                </h3>

                <div className="h-96 bg-gray-50 rounded-3xl p-6 mb-6 overflow-y-auto space-y-4" id="chat-container">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-16">Aún no hay mensajes. ¡Escribe el primero!</p>
                  ) : (
                    messages.map((msg: any, i: number) => (
                      <div key={i} className={`flex ${msg.isFromBuyer ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] px-5 py-3.5 rounded-3xl ${
                            msg.isFromBuyer
                              ? "bg-orange-600 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-75 mt-2 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Escribe un mensaje aquí..."
                    className="flex-1 px-6 py-4 border rounded-3xl focus:outline-none focus:border-orange-500"
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="px-10">
                    {sending ? <Loader2 className="animate-spin" /> : <Send size={22} />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Files Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-8">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6">Archivos del pedido ({files.length})</h3>

                <div className="min-h-[280px] bg-gray-50 rounded-3xl p-6 mb-6 overflow-y-auto space-y-4">
                  {files.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">Aún no hay archivos subidos</p>
                  ) : (
                    files.map((file: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border">
                        <Paperclip className="h-6 w-6 text-gray-400 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name || file.fileName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Subido por {file.uploadedBy === "buyer" ? "el comprador" : "el vendedor"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-7"
                  variant="outline"
                >
                  {uploading ? "Subiendo archivo..." : "Subir nuevo archivo"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}