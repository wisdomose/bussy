import Image from "next/image";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center">
      <Image
        src="/logo.png"
        width={384}
        height={285}
        quality={100}
        alt=""
        className="w-24 h-auto object-contain animate-pulse"
      />
    </div>
  );
}
