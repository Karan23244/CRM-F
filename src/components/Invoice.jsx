// import React from "react";

// /**
// * <Invoice data={invoiceData} />
// *
// * Expected data shape 👇
// * {
// *   company: {
// *     name: "CLICK ORBITS PTE LTD",
// *     address: "10 ANSON ROAD, #33‑10, INTERNATIONAL PLAZA, (079903)",
// *     uen: "202415100W",
// *     logo: "/logo.png" // optional
// *   },
// *   client: {
// *     legalName: "LEGAL ADV NAME",
// *     displayName: "Client Name",
// *     address: "Billing address line…",
// *     country: "ADV Country",
// *     placeOfSupply: "Singapore"
// *   },
// *   invoice: {
// *     number: "DSP/24‑25/0001",
// *     date: "2025‑05‑28",
// *     monthOfService: "February 2025",
// *     currency: "USD"
// *   },
// *   items: [
// *     { id: 1, description: "Digital Marketing Services", sac: "998365", quantity: 1, rate: 1000.0, amount: 1000.0 },
// *     { id: 2, description: "Campaign Management", sac: "998399", quantity: 1, rate: 500.0, amount: 500.0 }
// *   ],
// *   bank: {
// *     name: "OCBC Bank",
// *     branch: "Anson Road",
// *     accountNo: "123‑456‑789‑0",
// *     swift: "OCBCSGSGXXX",
// *     iban: "—",
// *     upi: "CLICKORBITS@okicici"
// *   },
// *   notes: "Payment due within 15 days via Bank Transfer/UPI. If you have any questions about this invoice, please contact accounts@clickorbits.com."
// * }
// */

// const currencyFormatter = (value, currency = "USD") =>
//   new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency,
//     minimumFractionDigits: 2,
//   }).format(value);

// const Invoice = ({ data }) => {
//   if (!data) return null;
//   const { company, client, invoice, items, bank, notes } = data;

//   const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
//   // Extend here for tax or other charges if needed
//   const total = subtotal;

//   return (
//     <div className="mx-auto my-10 max-w-4xl rounded-2xl bg-white p-8 shadow-2xl print:p-0 print:shadow-none">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-4 border-b pb-6">
//         {/* Company Info */}
//         <div>
//           {company.logo && (
//             <img
//               src={company.logo}
//               alt={company.name}
//               className="mb-2 h-12 w-auto"
//             />
//           )}
//           <h1 className="text-xl font-semibold uppercase tracking-wide">
//             {company.name}
//           </h1>
//           <p className="max-w-xs text-sm leading-relaxed text-gray-600">
//             {company.address}
//           </p>
//           {company.uen && (
//             <p className="mt-1 text-sm font-medium text-gray-700">
//               UEN: {company.uen}
//             </p>
//           )}
//         </div>

//         {/* Invoice Meta */}
//         <div className="text-right">
//           <h2 className="text-2xl font-bold tracking-wide text-gray-800">
//             INVOICE
//           </h2>
//           <div className="mt-2 grid grid-cols-2 gap-x-3 text-sm text-gray-700">
//             <span className="font-medium">Invoice #:</span>
//             <span>{invoice.number}</span>
//             <span className="font-medium">Date:</span>
//             <span>{invoice.date}</span>
//             <span className="font-medium">Month of Service:</span>
//             <span>{invoice.monthOfService}</span>
//             <span className="font-medium">Currency:</span>
//             <span>{invoice.currency}</span>
//           </div>
//         </div>
//       </div>

//       {/* Client Details */}
//       <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
//         <div>
//           <h3 className="font-semibold uppercase tracking-wide text-gray-800">
//             Bill To
//           </h3>
//           <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">
//             <span className="block font-medium">{client.displayName}</span>
//             {client.legalName && (
//               <span className="block">{client.legalName}</span>
//             )}
//             {client.address && <span className="block">{client.address}</span>}
//             {client.country && <span className="block">{client.country}</span>}
//           </p>
//         </div>
//         <div>
//           <h3 className="font-semibold uppercase tracking-wide text-gray-800">
//             Place of Supply
//           </h3>
//           <p className="mt-1 text-sm text-gray-700">{client.placeOfSupply}</p>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div className="mt-8 overflow-x-auto">
//         <table className="min-w-full border-collapse text-left text-sm">
//           <thead>
//             <tr className="border-b border-gray-300 bg-gray-100">
//               <th className="px-3 py-2 font-medium">S No.</th>
//               <th className="px-3 py-2 font-medium">Description</th>
//               <th className="px-3 py-2 font-medium">SAC</th>
//               <th className="px-3 py-2 font-medium text-right">Quantity</th>
//               <th className="px-3 py-2 font-medium text-right">Rate</th>
//               <th className="px-3 py-2 font-medium text-right">Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((item, idx) => (
//               <tr key={item.id} className="border-b last:border-0">
//                 <td className="px-3 py-2">{idx + 1}</td>
//                 <td className="px-3 py-2">{item.description}</td>
//                 <td className="px-3 py-2">{item.sac}</td>
//                 <td className="px-3 py-2 text-right">{item.quantity}</td>
//                 <td className="px-3 py-2 text-right">
//                   {currencyFormatter(item.rate, invoice.currency)}
//                 </td>
//                 <td className="px-3 py-2 text-right">
//                   {currencyFormatter(item.amount, invoice.currency)}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Totals */}
//       <div className="mt-6 flex flex-col items-end gap-2">
//         <div className="flex w-full max-w-xs items-center justify-between">
//           <span className="font-medium">Subtotal</span>
//           <span>{currencyFormatter(subtotal, invoice.currency)}</span>
//         </div>
//         {/* Add GST/VAT rows here if required */}
//         <div className="flex w-full max-w-xs items-center justify-between text-lg font-bold">
//           <span>Total</span>
//           <span>{currencyFormatter(total, invoice.currency)}</span>
//         </div>
//       </div>

//       {/* Bank Details & Notes */}
//       <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
//         {/* Bank Details */}
//         <div>
//           <h3 className="font-semibold uppercase tracking-wide text-gray-800">
//             Bank Details
//           </h3>
//           <ul className="mt-2 space-y-1 text-sm text-gray-700">
//             <li>
//               <span className="font-medium">Bank:</span> {bank.name}
//             </li>
//             <li>
//               <span className="font-medium">Branch:</span> {bank.branch}
//             </li>
//             <li>
//               <span className="font-medium">Account #:</span> {bank.accountNo}
//             </li>
//             {bank.swift && (
//               <li>
//                 <span className="font-medium">SWIFT:</span> {bank.swift}
//               </li>
//             )}
//             {bank.iban && (
//               <li>
//                 <span className="font-medium">IBAN:</span> {bank.iban}
//               </li>
//             )}
//             {bank.upi && (
//               <li>
//                 <span className="font-medium">UPI:</span> {bank.upi}
//               </li>
//             )}
//           </ul>
//         </div>

//         {/* Notes */}
//         {notes && (
//           <div>
//             <h3 className="font-semibold uppercase tracking-wide text-gray-800">
//               Notes
//             </h3>
//             <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
//               {notes}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Footer */}
//       <footer className="mt-16 text-center text-xs text-gray-500 print:mt-8">
//         This is a computer‑generated invoice and does not require a signature.
//       </footer>
//     </div>
//   );
// };

// export default Invoice;
import './style.css';
const InvoiceComponent = () => {
  return (
    <table cellSpacing="0" className="custom-class-385">
      <tbody>
        <tr className="custom-class-617">
          <td colSpan="6" className="custom-class-69">
            <p className="s1 custom-class-961">
              CLICK <span className="s2"> </span>ORBITS <span className="s2"> </span>PTE <span className="s2"> </span>LTD
            </p>
            <p className="s3 custom-class-970">
              10 <span className="s4"> </span>ANSON <span className="s4"> </span>ROAD,<span className="s4"> </span>#33-10,
              <span className="s4"> </span>INTERNATIONAL <span className="s4"> </span>PLAZA,<span className="s4"> </span>
              SINGAPORE <span className="s4"> </span>(079903)
            </p>
            <p className="custom-class-445"><br /></p>
            <p className="s5 custom-class-737">UEN: <span className="s6"> </span>202415100W</p>
          </td>
        </tr>

        <tr className="custom-class-300">
          <td colSpan="6" className="custom-class-29">
            <p className="s7 custom-class-425">
              INVOICE <span className="s8"> </span>for <span className="s8"> </span>Legal <span className="s8"> </span>ADV <span className="s8"> </span>NAME
            </p>
          </td>
        </tr>

        <tr className="custom-class-76">
          <td className="custom-class-383">
            <p className="s9 custom-class-997">Client <span className="s10"> </span>Name <span className="s10"> </span>Address</p>
            <p className="s9 custom-class-320">Place <span className="s10"> </span>of <span className="s10"> </span>Supply <span className="s10"> </span>#BEZUG!</p>
          </td>

          <td colSpan="2" className="custom-class-488">
            <p className="custom-class-659"><span></span></p>
            <table border="0" cellSpacing="0" cellPadding="0">
              <tbody><tr></tr></tbody>
            </table>
            <p></p>
            <p className="s11 custom-class-453">Legal <span className="s10"> </span>ADV <span className="s10"> </span>NAME <span className="s10"> </span>Billing <span className="s10"> </span>Add</p>
            <p className="s11 custom-class-891">ADV <span className="s10"> </span>Country <span className="s10"> </span>#BEZUG!</p>
          </td>

          <td className="custom-class-381">
            <p className="s9 custom-class-81">Invoice <span className="s10"> </span>Number <span className="s10"> </span>: <span className="s10"> </span>Date:</p>
            <p className="s9 custom-class-196">UEN</p>
            <p className="s9 custom-class-324">Country <span className="s10"> </span>of <span className="s10"> </span>Origin:</p>
          </td>

          <td colSpan="2" className="custom-class-736">
            <p className="s11 custom-class-309">ADSP/24-25/XXXX</p>
            <p className="s11 custom-class-120">Invoice <span className="s10"> </span>Date</p>
            <p className="s11 custom-class-31">202415100W</p>
            <p className="s11 custom-class-708">Singapore</p>
          </td>
        </tr>

        <tr className="custom-class-366">
          <td className="custom-class-4">
            <p className="s7 custom-class-873">S <span className="s8"> </span>No.</p>
          </td>
          <td className="custom-class-479"><p className="s7 custom-class-246">DESCRIPTION</p></td>
          <td className="custom-class-438"><p className="s7 custom-class-618">SAC</p></td>
          <td className="custom-class-162"><p className="s7 custom-class-962">QUANTITY</p></td>
          <td className="custom-class-540"><p className="s7 custom-class-825">RATE</p></td>
          <td className="custom-class-240"><p className="s7 custom-class-919">AMOUNT <span className="s8"> </span>IN <span className="s8"> </span>Currency</p></td>
        </tr>

        <tr className="custom-class-878">
          <td className="custom-class-570">
            <p className="custom-class-59"><br /></p>
            <p className="s12 custom-class-236">1</p>
          </td>
          <td className="custom-class-558">
            <p className="custom-class-650"><br /></p>
            <p className="s12 custom-class-427">Campaign <span className="s4"> </span>Name/Month</p>
          </td>
          <td className="custom-class-632">
            <p className="custom-class-864"><br /></p>
            <p className="s12 custom-class-974">70205</p>
          </td>
          <td className="custom-class-950"><p className="custom-class-882"><br /></p></td>
          <td className="custom-class-232"><p className="custom-class-443"><br /></p></td>
          <td className="custom-class-454">
            <p className="custom-class-722"><br /></p>
            <p className="s12 custom-class-598">Amount</p>
          </td>
        </tr>

        <tr className="custom-class-392">
          <td colSpan="3" className="custom-class-418">
            <p className="s12 custom-class-474">Amount <span className="s4"> </span>in <span className="s4"> </span>Words</p>
          </td>
          <td colSpan="2" className="custom-class-935">
            <p className="s3 custom-class-52">[A] <span className="s4"> </span>TOTAL</p>
          </td>
          <td className="custom-class-958">
            <p className="s12 custom-class-680">0.00</p>
          </td>
        </tr>

        <tr className="custom-class-18">
          <td colSpan="2" className="custom-class-811">
            <p className="s12 custom-class-469">
              Amount <span className="s4"> </span>of <span className="s4"> </span>Tax <span className="s4"> </span>subject <span className="s4"> </span>to <span className="s4"> </span>
              Reverse <span className="s4"> </span>Charges
            </p>
          </td>
          <td className="custom-class-674"><p className="s3 custom-class-293">No</p></td>
          <td colSpan="2" className="custom-class-276"><p className="custom-class-50"><br /></p></td>
          <td className="custom-class-915"><p className="custom-class-945"><br /></p></td>
        </tr>

        <tr className="custom-class-312">
          <td colSpan="3" className="custom-class-315">
            <p className="s13 custom-class-213">Terms <span className="s6"> </span>and <span className="s6"> </span>Conditions:</p>
            <ol>
              <li>
                <p className="s5 custom-class-662">
                  All <span className="s6"> </span>disputes <span className="s6"> </span>related <span className="s6"> </span>to this invoice... (truncated)
                </p>
              </li>
              <li>
                <p className="s3 custom-class-849">
                  Payments <span className="s4"> </span>to <span className="s4"> </span>be made in the below account
                </p>
              </li>
              {/* Add additional list items here if needed */}
            </ol>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default InvoiceComponent;

