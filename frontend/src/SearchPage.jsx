import { useLocation, useNavigate } from "react-router-dom";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const foundItems = location.state?.foundItems || [];

  return (
    <main className="flex items-center justify-center min-h-screen  text-white">
      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-center">🔍 Search Results</h1>

        {foundItems.length === 0 ? (
          <p className="text-center text-gray-400">
            No matching items found.
          </p>
        ) : (
          <div className="space-y-4">
            {foundItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600"
              >
                <p><strong>Title:</strong> {item.title}</p>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Category:</strong> {item.category}</p>
                {item.boxed_image_data && (
                  <img
                    src={item.boxed_image_data}
                    alt="Detected result"
                    className="mt-2 rounded-lg w-full max-h-64 object-contain"
                  />
                )}
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
