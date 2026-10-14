/**
 * Image compression and historical presets helper
 */

export interface HistoricalImagePreset {
  id: string;
  title: string;
  url: string;
  caption: string;
}

export const KURDISH_HISTORICAL_IMAGE_PRESETS: HistoricalImagePreset[] = [
  {
    id: 'erbil-citadel',
    title: 'قەڵای دێرینی هەولێر',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
    caption: 'قەڵای مێژوویی و هەزاران ساڵەی هەولێر لە دڵی کوردستان، یەکێک لە کۆنترین شارە ئاوەدانەکانی جیهان',
  },
  {
    id: 'sherwana-castle',
    title: 'قەڵای شێروانە',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80',
    caption: 'قەڵای شێروانە لە کەلار، شاکاری بیناسازی سەردەمی میرنشینە کوردییەکان لە گەرمیان',
  },
  {
    id: 'zagros-mountains',
    title: 'چیاکانی زاگرۆس و قەڵای سەردەمی ماد',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    caption: 'سروشت و چیا سەختەکانی زاگرۆس، مەکۆی بەرگری، سەرهەڵدان و فەرمانڕەوایی ئیمپراتۆریەتی ماد',
  },
  {
    id: 'ancient-relief',
    title: 'نەخشی بەردینی دێرین (لولوبی و گوتی)',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80',
    caption: 'نەخشی بەردینی پاشاکانی سەرپێڵی زەهاو (ئانووبانینی) و دەربەندی گاور لە چیاکانی کوردستان',
  },
  {
    id: 'manuscript-parchment',
    title: 'دەستنووسی مێژوویی و بەڵگەنامە',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80',
    caption: 'دەستنووسی دیوان و پەڕاوە دێرینەکانی میرنشینە کوردییەکان و بەڵگەنامە مێژووییەکان',
  },
  {
    id: 'amadiya-fortress',
    title: 'قەڵای ئامێدی لە بادینان',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    caption: 'قەڵا و شاری مێژوویی ئامێدی لەسەر لووتکەی شاخ، پایتەختی دێرینی میرنشینی بادینان',
  },
  {
    id: 'ishak-pasha-palace',
    title: 'کۆشکی ئیسحاق پاشا',
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
    caption: 'کۆشکی ئیسحاق پاشا لە بازید (باکووری کوردستان)، شاکاری هونەری تەلارسازی میرنشینی بایەزید',
  },
  {
    id: 'alwand-khanaqin',
    title: 'ڕووباری ئەڵوەن و خانەقین',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    caption: 'ڕووباری ئەڵوەن لە خانەقین، پێگەی مێژوویی دەروازەی باشووری ڕۆژهەڵاتی کوردستان',
  },
];

/**
 * Compresses an image file from user device into a lightweight base64 data URL
 * to store reliably in Firestore and LocalStorage.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 800,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('تکایە پەڕگەی وێنە هەڵبژێرە'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('هەڵە لە خوێندنەوەی وێنەکەدا ڕوویدا'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('هەڵە لە بارکردنی وێنەکەدا ڕوویدا'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('نەتوانرا وێنەکە ڕێکبخرێت'));
          return;
        }

        // Draw and compress to JPEG
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
