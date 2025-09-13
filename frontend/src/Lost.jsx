import { useState, useEffect } from "react";

const Lost = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/lost-items");
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  if (loading) {
    return (
      <main className="flex items-center justify-center bg-gray-900 text-white pt-20">
        <p className="text-gray-300 text-lg animate-pulse">
          Loading lost items...
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col  bg-gray-900 text-white pt-10 pb-24 px-6">
      <div className="flex-grow max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-10">
          📋 Reported Lost Items
        </h1>

        {items.length === 0 ? (
          <p className="text-gray-400 text-center">
            No lost items reported yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden 
                           hover:shadow-2xl hover:scale-105 transition duration-300"
              >
                <img
                  src={`data:${item.image_content_type};base64,${item.image_data}`}
                  alt={item.title}
                  className="w-full h-56 object-cover"
                />
                <div className="flex flex-col flex-grow p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">
                      {item.type === "lost" ? "📱" : "📦"}
                    </span>
                    <h2 className="text-xl font-semibold">{item.title}</h2>
                  </div>
                  <p className="text-gray-400 mb-2">Category: {item.category}</p>
                  <p className="text-gray-300 font-medium mb-4">
                    User: {item.user.username}
                  </p>
                  <div className="mt-auto">
                    <button
                      className="w-full py-2 rounded-lg font-semibold text-white 
                                 bg-gradient-to-r from-indigo-500 to-blue-600 
                                 hover:from-indigo-600 hover:to-blue-700 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Lost;
