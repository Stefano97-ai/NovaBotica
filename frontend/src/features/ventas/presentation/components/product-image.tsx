import { useState } from 'react';

const defaultImage = '/images/product-placeholder.svg';

export function ProductImage({ src }: { src?: string | null }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const image = src && src !== failedSource ? src : defaultImage;

  return <img className="pos-card-img" src={image} alt={image === defaultImage ? 'Nova Salud · imagen predeterminada' : 'Imagen del producto'}
    width={160} height={94} loading="lazy" decoding="async"
    onError={image !== defaultImage ? () => setFailedSource(image) : undefined} />;
}
