import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function parseNFeXML(xmlContent: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const items: any[] = [];
  
  const dets = xmlDoc.getElementsByTagName("det");
  for (let i = 0; i < dets.length; i++) {
    const prod = dets[i].getElementsByTagName("prod")[0];
    if (prod) {
      const name = prod.getElementsByTagName("xProd")[0]?.textContent || "";
      const quantity = parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0");
      const purchasePrice = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0");
      
      items.push({
        name,
        quantity,
        purchasePrice,
        // Sugestão de preço de venda com 40% de margem padrão
        suggestedPrice: purchasePrice * 1.4
      });
    }
  }
  
  return items;
}

/**
 * Otimiza URLs do Cloudinary com transformações automáticas.
 * - Converte para WebP/AVIF automaticamente
 * - Reduz qualidade automaticamente
 * - Redimensiona para a largura especificada
 * URLs não-Cloudinary são retornadas sem alteração.
 */
export function optimizeImageUrl(url: string | undefined | null, width = 400): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}

