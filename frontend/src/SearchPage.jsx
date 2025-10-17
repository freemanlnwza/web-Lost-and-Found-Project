import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showActualImage, setShowActualImage] = useState(false); // toggle state

  const foundItems = location.state?.foundItems ?? [];

  return (
    <main className="flex items-center justify-center min-h-screen text-white bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-center">🔍 Search Results</h1>

        {/* ปุ่ม toggle */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowActualImage(!showActualImage)}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            {showActualImage ? "Show Full Container" : "Show Actual Image"}
          </button>
        </div>

        {foundItems.length === 0 ? (
          <p className="text-center text-gray-400">No matching items found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foundItems.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 flex flex-col"
              >
                <p><strong>Title:</strong> {item.title || "-"}</p>
                <p><strong>Type:</strong> {item.type || "-"}</p>
                <p><strong>Category:</strong> {item.category || "-"}</p>
                <p><strong>User:</strong> {item.username || "-"}</p>

                {typeof item.similarity === "number" && (
                  <p className="text-green-400">
                    <strong>Similarity:</strong> {item.similarity.toFixed(4)}
                  </p>
                )}

                {/* แสดงภาพตาม toggle */}
                {item.original_image_data || item.boxed_image_data ? (
                  <div className="mt-2 w-full aspect-square relative overflow-hidden rounded-lg bg-gray-900">
                    <img
                      src={
                        showActualImage
                          ? item.original_image_data || item.boxed_image_data
                          : item.original_image_data || item.boxed_image_data
                      }
                      alt={item.title || "Image"}
                      className={
                        showActualImage
                          ? "w-full h-full object-contain" // actual image
                          : "w-full h-full object-cover"   // full container
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>
    </main>
  );
};

export default SearchPage;
