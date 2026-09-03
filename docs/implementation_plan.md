# Krypton v3.1: The Interactivity & Mobile Upgrade

This plan outlines the architecture for the three new features you selected, transforming Krypton from a static dashboard into a fully responsive, interactive application.

## Open Questions
> [!NOTE]
> **Data Entry Scope:** For the "Add Transaction" modal, I propose keeping it simple for now: it will allow you to quickly log an **Expense** (which increases `essentialExpenses`) or log **Income** (which adds to the `income` array and increases `currentSavings`). Does this simple split sound good?

## Proposed Changes

### 1. Mobile Responsiveness 📱
Currently, the app uses fixed grid layouts that squeeze on mobile screens.
#### [MODIFY] `client/src/App.css`
- Introduce responsive CSS classes (`.metrics-grid`, `.charts-grid`).
- Add mobile breakpoints (`@media (max-width: 768px)`) to stack grids to 1 or 2 columns.
- Hide the sidebar by default on mobile, placing it behind a slick hamburger menu overlay.
#### [MODIFY] `client/src/App.jsx`
- Replace inline grid styles with the new responsive CSS classes.
- Add state (`isMobileMenuOpen`) and a hamburger icon button in the header.

### 2. Expense Breakdown Pie Chart 🥧
#### [MODIFY] `client/src/App.jsx`
- Import `PieChart`, `Pie`, `Cell` from `recharts`.
- Dynamically calculate an expense breakdown (e.g., Housing 40%, Food 30%, Transport 20%, Utilities 10%) based on the user's total `essentialExpenses`.
- Add a beautiful donut chart below the Cash Flow chart.

### 3. Add Transaction Modal 💸
#### [MODIFY] `server/routes/apiRoutes.js`
- Create a new `POST /api/user/:userId/transaction` route.
#### [MODIFY] `server/controllers/userController.js`
- Create `addTransaction` logic that uses Mongoose (`User.findOneAndUpdate`) to push to the `income` array or increase `essentialExpenses`, returning the updated user object.
#### [MODIFY] `client/src/api.js`
- Add `addTransaction(userId, data)` function.
#### [MODIFY] `client/src/App.jsx`
- Build a glassmorphism modal overlay with a form (Amount, Type: Income/Expense).
- Hook up the form submission to the new API and trigger a `loadUser` refresh to animate the new numbers!

## Verification Plan
1. **Resize the browser window** to mobile width and verify the grid stacks and the hamburger menu appears.
2. **Review the dashboard** to ensure the new Expense Donut Chart renders with correct proportions and colors.
3. **Click "Add Entry"**, log a ₹5,000 income, and verify the Safe to Spend and Savings numbers roll up instantly.
