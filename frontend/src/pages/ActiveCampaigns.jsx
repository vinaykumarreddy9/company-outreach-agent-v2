import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowUpDown,
  Trash2,
  Power,
  Target,
  Users,
  CheckCircle2,
  Loader2,
  Square,
  CheckSquare,
} from "lucide-react";
import axios from "axios";
import API_BASE_URL from "../config";

const ActiveCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/campaigns`);
      const activeOnly = response.data.filter((c) => c.status !== "INACTIVE");
      setCampaigns(activeOnly);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [processingId, setProcessingId] = useState(null); // Track WHICH campaign is being processed
  const [processingAction, setProcessingAction] = useState(null); // 'delete', 'deactivate', 'batch-delete', 'batch-deactivate'

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this campaign permanently?",
      )
    )
      return;
    setProcessingId(id);
    setProcessingAction("delete");
    try {
      await axios.delete(`${API_BASE_URL}/campaigns/${id}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (error) {
      console.error("Error deleting campaign:", error);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleDeactivate = async (id) => {
    setProcessingId(id);
    setProcessingAction("deactivate");
    try {
      await axios.patch(
        `${API_BASE_URL}/campaigns/${id}/status?status=INACTIVE`,
      );
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (error) {
      console.error("Error deactivating campaign:", error);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} campaigns permanently?`,
      )
    )
      return;

    setProcessingAction("batch-delete");
    try {
      await axios.post(`${API_BASE_URL}/campaigns/batch-delete`, {
        campaign_ids: selectedIds,
      });
      setCampaigns((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Error in batch delete:", error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBatchDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setProcessingAction("batch-deactivate");
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.patch(
            `${API_BASE_URL}/campaigns/${id}/status?status=INACTIVE`,
          ),
        ),
      );
      setCampaigns((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Error in batch deactivate:", error);
    } finally {
      setProcessingAction(null);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCampaigns.map((c) => c.id));
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "newest" ? "oldest" : "newest");
  };

  const filteredCampaigns = campaigns
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.query.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-green-600 border-green-100";
      case "FAILED":
        return "bg-red-50 text-red-600 border-red-100";
      case "PENDING":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "INACTIVE":
        return "bg-zinc-50 text-zinc-400 border-zinc-100";
      default:
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-10 py-12 bg-white min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <h1 className="text-[40px] font-black text-[#1e293b] tracking-tight leading-tight">
            Active Campaigns
          </h1>
          <p className="text-zinc-400 font-semibold text-lg">
            Monitor and manage your currently running outreach campaigns.
          </p>
        </div>

        <Link
          to="/create"
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-2xl shadow-brand-primary/30 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} strokeWidth={3} />
          Create Campaign
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 mb-10 w-full">
        <div className="relative flex-grow group w-full">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand-primary transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by campaign name or objective..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-100 rounded-[20px] pl-16 pr-6 py-4.5 text-[#1e293b] font-bold outline-none focus:bg-white focus:border-brand-primary focus:shadow-xl focus:shadow-indigo-500/5 transition-all placeholder:text-zinc-300"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDeactivate}
              disabled={processingAction !== null}
              className="flex-grow lg:flex-grow-0 flex items-center justify-center gap-2 px-6 py-4.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/10 rounded-[20px] font-black text-sm hover:bg-brand-primary hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
              {processingAction === "batch-deactivate" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Power size={18} strokeWidth={3} />
              )}
              {processingAction === "batch-deactivate"
                ? "Deactivating..."
                : "Deactivate Selected"}
            </button>
          )}
          <button
            disabled={selectedIds.length === 0 || processingAction !== null}
            onClick={handleBatchDelete}
            className={`flex-grow lg:flex-grow-0 flex items-center justify-center gap-2 px-6 py-4.5 rounded-[20px] font-black text-sm transition-all shadow-sm ${
              selectedIds.length > 0
                ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100"
                : "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed opacity-50"
            } disabled:opacity-50`}
          >
            {processingAction === "batch-delete" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} strokeWidth={3} />
            )}
            {processingAction === "batch-delete"
              ? "Deleting..."
              : `Batch Delete ${selectedIds.length > 0 ? `(${selectedIds.length})` : ""}`}
          </button>
          <button
            onClick={toggleSort}
            className="flex-grow lg:flex-grow-0 flex items-center justify-center gap-2 px-6 py-4.5 bg-white border border-zinc-100 rounded-[20px] text-[#1e293b] font-bold text-sm hover:bg-zinc-50 transition-all"
          >
            <ArrowUpDown size={18} />
            Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      {filteredCampaigns.length > 0 && (
        <div className="flex items-center gap-3 mb-6 px-4">
          <button
            onClick={toggleSelectAll}
            disabled={processingAction !== null}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#1e293b] hover:text-brand-primary transition-colors disabled:opacity-50"
          >
            {selectedIds.length === filteredCampaigns.length ? (
              <CheckSquare
                size={16}
                className="text-brand-primary"
                strokeWidth={3}
              />
            ) : (
              <Square size={16} strokeWidth={3} />
            )}
            {selectedIds.length === filteredCampaigns.length
              ? "Deselect All"
              : "Select All Campaigns"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">
              Accessing Intelligence Network...
            </p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 border border-zinc-100 rounded-[40px] border-dashed">
            <Target className="w-16 h-16 text-zinc-200 mb-6" />
            <p className="text-zinc-400 font-bold">
              No active campaigns found matching your search.
            </p>
            <Link
              to="/create"
              className="text-brand-primary font-black text-sm mt-4 hover:underline"
            >
              Start your first mission
            </Link>
          </div>
        ) : (
          filteredCampaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className={`bg-white border rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex items-center gap-6 ${
                selectedIds.includes(campaign.id)
                  ? "border-brand-primary/40 bg-brand-primary/[0.02]"
                  : "border-zinc-100"
              }`}
            >
              <button
                onClick={() => toggleSelect(campaign.id)}
                className={`flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                  selectedIds.includes(campaign.id)
                    ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-zinc-50 border-zinc-100 text-transparent"
                }`}
              >
                <CheckCircle2 size={16} strokeWidth={4} />
              </button>

              <div className="flex items-center justify-between flex-grow">
                <Link
                  to={`/campaign/${campaign.id}`}
                  className="flex gap-5 flex-grow cursor-pointer group/info"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-shrink-0 items-center justify-center shadow-sm border border-zinc-50 transition-transform group-hover/info:scale-110 ${index % 3 === 0 ? "bg-indigo-50 text-indigo-500" : index % 3 === 1 ? "bg-blue-50 text-blue-500" : "bg-pink-50 text-pink-500"}`}
                  >
                    {index % 3 === 0 ? (
                      <Target size={28} />
                    ) : index % 3 === 1 ? (
                      <Users size={28} />
                    ) : (
                      <CheckCircle2 size={28} />
                    )}
                  </div>
                  <div className="space-y-1 pt-1 flex-grow">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-[#1e293b] tracking-tight group-hover/info:text-brand-primary transition-colors">
                        {campaign.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-zinc-400 font-semibold text-sm line-clamp-1 max-w-4xl">
                      {campaign.query}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    disabled={processingId === campaign.id}
                    onClick={() => handleDeactivate(campaign.id)}
                    className="flex items-center gap-2 px-5 py-3.5 bg-zinc-50 text-[#1e293b] rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-primary/10 hover:text-brand-primary transition-all shadow-sm disabled:opacity-50"
                  >
                    {processingId === campaign.id &&
                    processingAction === "deactivate" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} strokeWidth={3} />
                    )}
                    {processingId === campaign.id &&
                    processingAction === "deactivate"
                      ? "Deactivating..."
                      : "Deactivate"}
                  </button>
                  <button
                    disabled={processingId === campaign.id}
                    onClick={() => handleDelete(campaign.id)}
                    className="flex items-center gap-2 px-5 py-3.5 bg-red-50 text-red-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                  >
                    {processingId === campaign.id &&
                    processingAction === "delete" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} strokeWidth={3} />
                    )}
                    {processingId === campaign.id &&
                    processingAction === "delete"
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveCampaigns;
