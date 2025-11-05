import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PiImagesSquareDuotone } from "react-icons/pi";
import { API_URL } from "./configurl"; 

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showActualImage, setShowActualImage] = useState(false); // toggle state

  const foundItems = location.state?.foundItems ?? [];

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4 py-8">
      <div
        className="
          w-full 
          max-w-6xl 
          bg-gray-800/90 
          backdrop-blur-md 
          rounded-2xl 
          shadow-2xl 
          p-6 
          space-y-6 
          border border-gray-700
        "
      >
       {/* Header + Toggle */}
<div className="flex items-center justify-between mt-5 px-4 sm:px-0">
  <h1 className="text-2xl sm:text-3xl font-bold">
    🔍 Search Results
  </h1>

  <button
    onClick={() => setShowActualImage(!showActualImage)}
    className={`p-2 mt-2 sm:p-3 rounded-full transition-all flex items-center justify-center ${
      showActualImage ? "bg-green-500" : "bg-yellow-500 hover:bg-yellow-600"
    }`}
    title={showActualImage ? "Show Container-Fit" : "Show Actual Image"}
  >
    <PiImagesSquareDuotone className="h-4 w-4 sm:h-5 sm:w-5" />
  </button>
</div>

        {/* Search Results */}
        {foundItems.length === 0 ? (
          <p className="text-center text-gray-400">No matching items found.</p>
        ) : (
          <div
            className="
              grid 
              grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-3 
              gap-6
            "
          >
            {foundItems.map((item, index) => (
              <div
                key={item.id || index}
                className="
                  bg-gray-700 
                  rounded-lg 
                  p-4 
                  border 
                  border-gray-600 
                  flex 
                  flex-col 
                  text-sm sm:text-base
                "
              >
                <p><strong>Title:</strong> {item.title || "-"}</p>
                <p><strong>Category:</strong> {item.category || "-"}</p>
                <p><strong>User:</strong> {item.username || "-"}</p>

                {typeof item.similarity === "number" && (
                  <p className="text-green-400">
                    <strong>Similarity:</strong> {item.similarity.toFixed(4)}
                  </p>
                )}

                {/* Image */}
                {(item.original_image_data || item.boxed_image_data) && (
                  <div className="mt-3 w-full aspect-square relative overflow-hidden rounded-lg bg-gray-900">
                    <img
                      src={
                        showActualImage
                          ? item.original_image_data || item.boxed_image_data
                          : item.original_image_data || item.boxed_image_data
                      }
                      alt={item.title || "Image"}
                      className={
                        showActualImage
                          ? "w-full h-full object-contain"
                          : "w-full h-full object-cover"
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="
              py-2 
              px-6 
              bg-blue-600 
              hover:bg-blue-700 
              rounded-lg 
              font-semibold 
              text-sm sm:text-base 
              transition
            "
          >
             Back
          </button>
        </div>
      </div>
    </main>
  );
};

export default SearchPage;
