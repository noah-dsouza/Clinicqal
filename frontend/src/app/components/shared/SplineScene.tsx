import { Suspense, lazy } from 'react';
const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense fallback={
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
