
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AddEntityModal from "@/components/common/AddEntityModal";
import AddMaintenanceRequestForm from "@/components/maintenance/AddMaintenanceRequestForm";
import MaintenanceSummaryCards from "@/components/maintenance/MaintenanceSummaryCards";
import MaintenanceFilters from "@/components/maintenance/MaintenanceFilters";
import MaintenanceTabs from "@/components/maintenance/MaintenanceTabs";
import { useMaintenanceData } from "@/hooks/useMaintenanceData";
import { Maintenance } from "@/types";

const MaintenancePage = () => {
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    sortField,
    sortDirection,
    sortedRequests,
    openRequests,
    closedRequests,
    toggleSort,
    getTenantName,
    getPropertyName,
    handleAddRequest,
    maintenanceRequests,
    refreshData
  } = useMaintenanceData();

  const handleAddRequestSuccess = async (formData: any) => {
    const success = await handleAddRequest(formData);
    
    if (success) {
      setShowAddModal(false);
      toast({
        title: "Success",
        description: "Maintenance request has been submitted successfully."
      });
      
      // Refresh data to show the new maintenance request
      refreshData();
    } else {
      toast({
        title: "Error",
        description: "Failed to submit maintenance request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // The previous fix was incomplete. We need to make this function compatible with AddEntityModal
  const modalSaveHandler = () => {
    // We're not actually using this function for form submission
    // The actual submission is handled by the AddMaintenanceRequestForm component's onSuccess
    console.log("Modal save handler called - form handled independently");
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maintenance</h1>
        <p className="text-muted-foreground mt-2">Track and manage maintenance requests</p>
      </div>

      <MaintenanceSummaryCards maintenanceRequests={maintenanceRequests} />

      <MaintenanceFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter as "all" | "low" | "medium" | "high" | "emergency"}
        setPriorityFilter={setPriorityFilter as React.Dispatch<React.SetStateAction<"all" | "low" | "medium" | "high" | "emergency">>}
        onAddRequest={() => setShowAddModal(true)}
      />

      <MaintenanceTabs
        openRequests={openRequests}
        closedRequests={closedRequests}
        allRequests={sortedRequests}
        sortField={sortField as keyof Maintenance}
        sortDirection={sortDirection}
        onSort={toggleSort}
        getTenantName={getTenantName}
        getPropertyName={getPropertyName}
      />

      <AddEntityModal
        title="New Maintenance Request"
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={modalSaveHandler}
      >
        <AddMaintenanceRequestForm onSuccess={handleAddRequestSuccess} />
      </AddEntityModal>
    </div>
  );
};

export default MaintenancePage;
