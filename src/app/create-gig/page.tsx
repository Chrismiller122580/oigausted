"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function CreateGigPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-center">Publicar un Nuevo Gig</h1>
      <p className="text-center text-muted-foreground mb-10">Llena los datos y empieza a ganar dinero con tus habilidades</p>

      <div className="bg-white border rounded-3xl p-10 shadow-sm">
        <div className="space-y-8">
          <div>
            <Label htmlFor="title">Título del Gig</Label>
            <Input id="title" placeholder="Ej: Diseño de logo profesional" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={5} placeholder="Describe tu servicio con detalle..." className="mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diseno">Diseño Gráfico</SelectItem>
                  <SelectItem value="web">Desarrollo Web</SelectItem>
                  <SelectItem value="marketing">Marketing Digital</SelectItem>
                  <SelectItem value="asistente">Asistente Virtual</SelectItem>
                  <SelectItem value="turismo">Turismo & Experiencias</SelectItem>
                  <SelectItem value="musica">Producción Musical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Precio base (COP)</Label>
              <Input id="price" type="number" placeholder="150000" className="mt-2" />
            </div>
          </div>

          <div>
            <Label htmlFor="delivery">Tiempo de entrega (días)</Label>
            <Input id="delivery" type="number" placeholder="3" className="mt-2" />
          </div>

          <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-6 text-lg font-medium">
            Publicar Gig Ahora
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Al publicar aceptas nuestros términos. El gig aparecerá públicamente después de revisión.
          </p>
        </div>
      </div>
    </div>
  )
}
