"use client";

export default function StepEditorLayout({
  sidebar,
  content,
  footer,
}: {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex" }}>
        <aside
          style={{
            width: 260,
            borderRight: "1px solid #ddd",
            padding: 16,
          }}
        >
          {sidebar}
        </aside>

        <main
          style={{
            flex: 1,
            padding: 24,
            overflowY: "auto",
          }}
        >
          {content}
        </main>
      </div>

      <footer
        style={{
          borderTop: "1px solid #ddd",
          padding: 16,
        }}
      >
        {footer}
      </footer>
    </div>
  );
}
