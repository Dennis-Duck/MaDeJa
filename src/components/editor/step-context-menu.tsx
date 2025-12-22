import { useState } from "react";

export default function StepContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mediaId: string;
  } | null>(null);

  const handleContextMenu = (
    e: React.MouseEvent,
    mediaId: string
  ) => {
    e.preventDefault(); // voorkom standaard browser menu
    setContextMenu({ x: e.clientX, y: e.clientY, mediaId });
  };

  const handleCloseMenu = () => setContextMenu(null);

  const handleDelete = (mediaId: string) => {
    console.log("Delete media", mediaId);
    handleCloseMenu();
  };

  const handleBringToFront = (mediaId: string) => {
    console.log("Bring to front", mediaId);
    handleCloseMenu();
  };

  // voorbeeld media array
  const mediaArray = [
    { id: "m1", url: "/dog.png", type: "IMAGE" },
    { id: "m2", url: "/cat.png", type: "IMAGE" },
  ];

  return (
    <div
      style={{ width: "600px", height: "400px", position: "relative", border: "1px solid #ccc" }}
      onClick={handleCloseMenu} // klik ergens anders sluit menu
    >
      {mediaArray.map((m) => (
        <img
          key={m.id}
          src={m.url}
          alt=""
          style={{ width: 100, position: "absolute", top: 50, left: 50 }}
          onContextMenu={(e) => handleContextMenu(e, m.id)}
        />
      ))}

      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "white",
            border: "1px solid #ccc",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          <button onClick={() => handleDelete(contextMenu.mediaId)}>Delete</button>
          <button onClick={() => handleBringToFront(contextMenu.mediaId)}>Bring to Front</button>
        </div>
      )}
    </div>
  );
}
