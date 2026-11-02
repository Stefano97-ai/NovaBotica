"use client";

import React, { useState } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Headphones,
  MessageCircle,
} from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!usuario.trim() || !contrasena.trim()) {
      setMensaje({
        tipo: "error",
        texto: "Por favor completa todos los campos para ingresar.",
      });
      return;
    }

    setCargando(true);

    // Simulación de autenticación
    setTimeout(() => {
      setCargando(false);
      setMensaje({
        tipo: "exito",
        texto: `¡Bienvenido al sistema, ${usuario}! Acceso autorizado.`,
      });
    }, 1200);
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0f0c31]">
      {/* PANEL IZQUIERDO (Identidad y Marca) */}
      <section className="relative w-full lg:w-[52%] bg-[#0f0c31] text-white flex flex-col justify-between p-8 sm:p-14 lg:p-20 select-none overflow-hidden">
        {/* Marca superior */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center bg-transparent border-2 border-white">
            <Plus className="w-5 h-5 text-white stroke-[3.5]" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-wider uppercase">
            NOVA SALUD
          </span>
        </div>

        {/* Mensaje central */}
        <div className="my-16 lg:my-auto -translate-y-4 sm:-translate-y-6 lg:-translate-y-10 z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-wide uppercase leading-tight">
            GESTIÓN DE BOTICA
          </h1>
          <p
            style={{
              fontFamily:
                "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
            }}
            className="mt-8 sm:mt-10 text-sm sm:text-base text-indigo-200/80 tracking-wide font-normal leading-relaxed"
          >
            Inventario por lotes &middot; Ventas &middot; Compras &middot; Facturación
          </p>

          {/* Cuadro 1: Aviso de seguridad y asistencia */}
          <div className="mt-8 sm:mt-10 bg-[#1a1744]/75 border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 max-w-lg space-y-3 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-indigo-300 shrink-0" />
              <span className="text-xs sm:text-[13px] text-indigo-100/90 font-light leading-snug">
                Por tu seguridad, no guardes tus credenciales en equipos públicos.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="w-4 h-4 text-indigo-300 shrink-0" />
              <span className="text-xs sm:text-[13px] text-indigo-100/90 font-light leading-snug">
                ¿Problemas para ingresar? Contáctanos para ayudarte.
              </span>
            </div>
          </div>

          {/* Cuadro 2: Botón Solicitar Soporte */}
          <div className="mt-4 sm:mt-5">
            <button
              type="button"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#201c4e]/90 hover:bg-[#282361] border border-white/10 hover:border-white/20 rounded-full text-xs sm:text-sm font-medium text-white shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Solicitar Soporte</span>
            </button>
          </div>
        </div>

        {/* Pie decorativo / versión */}
        <div className="text-xs text-indigo-300/40 z-10 hidden sm:block">
          NovaBotica Enterprise &bull; v1.0
        </div>

        {/* Efecto de luz ambiental sutil en el fondo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* PANEL DERECHO (Formulario de Inicio de Sesión) */}
      <section className="w-full lg:w-[48%] bg-[#f1f4f9] flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-20">
        <div className="w-full max-w-[430px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-100 p-8 sm:p-12 transition-all">
          
          {/* Encabezado del Formulario */}
          <div className="mb-9 sm:mb-10">
            <h2 className="text-2xl sm:text-[26px] font-bold text-[#0f172a] tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-slate-400 mt-3 sm:mt-3.5 font-normal leading-relaxed">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Notificación de retroalimentación */}
          {mensaje && (
            <div
              className={`mb-7 p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 transition-all ${
                mensaje.tipo === "exito"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {mensaje.tipo === "exito" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo: Usuario */}
            <div className="space-y-2">
              <label
                htmlFor="usuario"
                className="block text-xs font-medium text-slate-500"
              >
                Usuario
              </label>
              <div className="relative">
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej. admin o farmacia"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all"
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-2">
              <label
                htmlFor="contrasena"
                className="block text-xs font-medium text-slate-500"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  aria-label={mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                  {mostrarContrasena ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Enviar */}
            <div className="pt-3 sm:pt-4">
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 px-4 bg-[#3827c2] hover:bg-[#3021a8] active:bg-[#281c8f] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed hover:shadow-indigo-600/40"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>VERIFICANDO...</span>
                  </>
                ) : (
                  <span>INGRESAR AL SISTEMA</span>
                )}
              </button>
            </div>
          </form>

          {/* Nota al pie académica */}
          <div className="mt-12 sm:mt-14 text-center">
            <p className="text-[11px] sm:text-xs text-slate-400 font-light tracking-wide">
              Demo académica &middot; No emite comprobantes reales
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
