export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <article className="mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-3xl font-bold tracking-tight">{slug}</h1>
      <p className="mt-4 text-muted-foreground">Post content coming soon.</p>
    </article>
  );
}
