import LoginForm from "@/components/login";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="bold">Home</h1>
      <div className="flex flex-row items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
