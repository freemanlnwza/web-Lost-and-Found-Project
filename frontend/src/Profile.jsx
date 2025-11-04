import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Package } from "lucide-react";

export default function Profile() {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    if (!user.id) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    // Fetch user's posts
    fetchUserPosts(user.id);
  }, [navigate]);

  const fetchUserPosts = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/user/${userId}/items`);
      if (res.ok) {
        const data = await res.json();
        setUserPosts(data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const formData = new FormData();
      formData.append("user_id", currentUser.id);

      const res = await fetch(`http://localhost:8000/api/items/${itemId}`, {
        method: "DELETE",
        body: formData,
      });

      if (res.ok) {
        alert("Post deleted successfully!");
        setUserPosts(userPosts.filter(post => post.id !== itemId));
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post");
    }
  };

  const handleEdit = (item) => {
    navigate(`/edit-post/${item.id}`, { state: { item } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center py-56 ">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">
          Account Profile
        </h1>
        <div className="space-y-4">
          <p>
            <span className="font-semibold text-white">Username: </span>
            {user.username}
          </p>
          <p>
            <span className="font-semibold text-white">Email: </span>
            {user.email}
          </p>
        </div>

        {/* Posts Grid */}
        {userPosts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto text-gray-600 mb-4" size={64} />
            <p className="text-gray-400 text-xl">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all"
              >
                {/* Image */}
                <img
                  src={post.image_data}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      post.type === "lost" 
                        ? "bg-red-500/20 text-red-400" 
                        : "bg-green-500/20 text-green-400"
                    }`}>
                      {post.type}
                    </span>
                    <span className="text-gray-400 text-sm">{post.category}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}