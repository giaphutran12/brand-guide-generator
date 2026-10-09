import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideView } from "@/components/GuideView";
import { listExamples, loadExample } from "@/lib/examples";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listExamples()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const guide = await loadExample((await params).slug);
  return { title: guide ? `${guide.brand.name} brand guide` : "Brand guide" };
}

export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = await loadExample((await params).slug);
  if (!guide) notFound();
  return (
    <main className="shell">
      <nav className="crumbs">
        <Link href="/">← Brand Guide Generator</Link>
      </nav>
      <GuideView guide={guide} />
    </main>
  );
}
