# Chenda Process Flows

This document details the core business processes and technical workflows within the Chenda platform.

---

## 1. Dispatch & Delivery Process Flow

The dispatch and delivery process ensures that fresh products reach the buyer efficiently, maintaining transparency for all parties involved (Buyer, Seller, and Rider).

### 1.1 Overview
Chenda supports two primary fulfillment models:
- **In-house Delivery**: Using registered Riders on the platform.
- **Third-party Delivery**: Using external couriers (e.g., Lalamove, Grab, etc.).

### 1.2 Step-by-Step Workflow

#### Phase 1: Order Ready for Dispatch
1. **Order Confirmation**: Once a buyer places an order and it is confirmed, it appears in the Seller's **Orders** dashboard.
2. **Fulfillment Selection**: The Seller chooses how to fulfill the order:
   - **In-house**: The seller views a list of **Available Riders** (riders who have toggled their status to "Available").
   - **Third-party**: The seller chooses an external provider.

#### Phase 2: Assignment & Dispatch
- **For In-house Riders**:
  1. The Seller assigns the order to a specific Rider and sets an estimated time of arrival (ETA).
  2. The Rider receives a **Notification** and the job appears in their **Available Jobs** or **Dashboard**.
  3. The Rider can either **Accept** or **Decline** the job.
  4. If declined, the Seller is notified and must reassign the order.
  5. If accepted, the status changes to `accepted`.
- **For Third-party Couriers**:
  1. The Seller enters the **Provider Name** and **Tracking Reference**.
  2. The status immediately moves to `in_transit`.

#### Phase 3: Pickup & Transit (In-house Only)
1. **Pickup**: The Rider travels to the Seller's location and marks the order as **Picked Up**.
2. **In Transit**: The Rider starts the delivery and marks the status as **In Transit**.
3. **Live Tracking**: As the Rider moves, they send **Location Updates** (either manually or automatically via the app).
4. **Proximity Alert**: When the Rider is within a specific radius (e.g., 300m) of the Buyer, a `near_destination` event is automatically triggered and the Buyer is notified.

#### Phase 4: Fulfillment & Completion
1. **Delivery**: The Rider arrives at the Buyer's location.
2. **Proof of Delivery (POD)**: The Rider must take a photo of the delivered goods and upload it via the app.
3. **Completion**: Upon photo upload, the status is automatically updated to `delivered`.
4. **Failure Handling**: If the delivery cannot be completed (e.g., recipient unavailable), the Rider marks it as **Failed** and provides a reason.

### 1.3 Status Lifecycle Summary

| Status | Meaning | Actor |
| :--- | :--- | :--- |
| `available` | Order is ready for any rider to claim. | Seller |
| `assigned` | Order is assigned to a specific rider. | Seller |
| `accepted` | Rider has committed to the delivery. | Rider |
| `declined` | Rider turned down the assignment. | Rider |
| `picked_up` | Rider has collected the items from the seller. | Rider |
| `in_transit` | Order is on its way to the buyer. | Rider |
| `delivered` | Proof of delivery uploaded; order complete. | Rider |
| `failed` | Delivery attempt was unsuccessful. | Rider |
| `cancelled` | Order or delivery was terminated. | System/Admin |

---

## 2. Notification System Flow

Notifications keep the ecosystem synchronized during the delivery lifecycle.

- **System Events**: Status changes (e.g., `delivery_assigned`, `delivery_picked_up`) trigger automated notifications.
- **Recipients**:
  - **Buyers**: Receive updates about their order progress and rider proximity.
  - **Sellers**: Receive updates about rider acceptance and delivery completion.
  - **Riders**: Receive job assignments and issue reports.
- **Issue Reporting**: Buyers and Sellers can report issues during delivery, which notifies all relevant parties and logs a `delivery_issue_reported` event in the timeline.
