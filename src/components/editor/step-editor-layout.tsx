"use client";

export default function StepEditorLayout({
  sidebar,
  content,
  overlay,
  footer,
}: {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  overlay?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          position: "relative",
        }}
      >
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
            minHeight: 0,
            padding: 24,
            overflowY: "auto",
            position: "relative",
          }}
        >
          {content}
        </main>

        {overlay && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              {overlay}
            </div>
          </div>
        )}
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
