import React from 'react';

const Bill = ({ items, total, discountedTotal, paymentMethod, responsibleName, onPrint }) => {
  return (
    <div id="bill" style={{ display: 'none' }}>
      <h2>Your Bill</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.name} - Quantity: {item.quantity} - Price: ₹{item.price}
          </li>
        ))}
      </ul>
      <h3>Total: ₹{total}</h3>
      <h3>Discounted Total: ₹{discountedTotal}</h3>
      <h4>Payment Method: {paymentMethod}</h4>
      {responsibleName && <h4>Responsible: {responsibleName}</h4>}
      <button onClick={onPrint}>Print Bill</button>
    </div>
  );
};

export default Bill;
