import "./style.css";
import { useEffect, useState } from "react";
// Utility to format current date
const getCurrentDate = () => {
  const today = new Date();
  return today.toLocaleDateString("en-GB");
};

// Utility to get current month name
const getCurrentMonth = () => {
  const date = new Date();
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};
// Utility to format selected month and year
const formatSelectedMonth = (dateObj) => {
  if (!dateObj) return "";
  return dateObj.toLocaleString("default", { month: "long", year: "numeric" });
};
let invoiceCounter = 1000; // In production, use backend or persistent storage
const InvoiceComponent = ({
  selectedAdvertisers = [],
  address,
  amount,
  selectedMonth,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    // Generate unique invoice number
    const serial = invoiceCounter++;
    setInvoiceNumber(`ADSP/24-25/${serial}`);
  }, []);

  const advertiserName = selectedAdvertisers?.join(", ");
  const currentDate = getCurrentDate();
  const selectedDate = selectedMonth?.$d
    ? new Date(selectedMonth.$d)
    : new Date();
  const month = selectedDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div>
        <table cellSpacing={0} className="custom-class-385">
          <tbody>
            <tr className="custom-class-617">
              <td colSpan={6} className="custom-class-69">
                <div className="flex items-center gap-4">
                  {/* Logo Image */}
                  <img
                    src="/AdsprosperLogo.png"
                    alt="Company Logo"
                    className="w-16 h-16 object-contain"
                  />

                  {/* Company Info */}
                  <div>
                    <p className="s1 custom-class-961">
                      CLICK<span className="s2"> </span>ORBITS
                      <span className="s2"> </span>PTE
                      <span className="s2"> </span>
                      LTD
                    </p>
                    <p className="s3 custom-class-970">
                      10<span className="s4"> </span>ANSON
                      <span className="s4"> </span>ROAD,
                      <span className="s4"> </span>#33-10,
                      <span className="s4"> </span>INTERNATIONAL
                      <span className="s4"> </span>PLAZA,
                      <span className="s4"></span>SINGAPORE
                      <span className="s4"> </span>(079903)
                    </p>
                    <p className="custom-class-445">
                      <br />
                    </p>
                    <p className="s5 custom-class-737">
                      UEN:<span className="s6"> </span>202415100W
                    </p>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="custom-class-300">
              <td colSpan={6} className="custom-class-29">
                <p className="s7 custom-class-425">
                  INVOICE<span className="s8"> </span>for
                  <span className="s8"> </span>Legal
                  <span className="s8"> </span>ADV<span className="s8"> </span>
                  NAME
                </p>
              </td>
            </tr>
            <tr className="custom-class-76">
              <td className="custom-class-383">
                <p className="s9 custom-class-997">
                  Client<span className="s10"> </span>Name
                  <span className="s10"> </span>Address
                </p>
                <p className="s9 custom-class-320">
                  Place<span className="s10"> </span>of
                  <span className="s10"> </span>Supply
                  <span className="s10"> </span>#BEZUG!
                </p>
              </td>
              <td colSpan={2} className="custom-class-488">
                <p className="custom-class-659">
                  <span />
                </p>
                <table border={0} cellSpacing={0} cellPadding={0}>
                  <tbody>
                    <tr />
                  </tbody>
                </table>
                <p />
                <p className="s11 custom-class-453">{advertiserName}</p>
                <p className="s11 custom-class-891">{address}</p>
              </td>
              <td className="custom-class-381">
                <p className="s9 custom-class-81">
                  Invoice<span className="s10"> </span>Number
                  <span className="s10"> </span>:<span className="s10"> </span>
                  Date:
                </p>
                <p className="s9 custom-class-196">UEN</p>
                <p className="s9 custom-class-324">
                  Country<span className="s10"> </span>of
                  <span className="s10"> </span>Origin:
                </p>
              </td>
              <td colSpan={2} className="custom-class-736">
                <p className="s11 custom-class-309">{invoiceNumber}</p>
                <p className="s11 custom-class-120">{currentDate}</p>
                <p className="s11 custom-class-31">202415100W</p>
                <p className="s11 custom-class-708">Singapore</p>
              </td>
            </tr>
            <tr className="custom-class-366">
              <td className="custom-class-4">
                <p className="s7 custom-class-873">
                  S<span className="s8"> </span>No.
                </p>
              </td>
              <td className="custom-class-479">
                <p className="s7 custom-class-246">DESCRIPTION</p>
              </td>
              <td className="custom-class-438">
                <p className="s7 custom-class-618">SAC</p>
              </td>
              <td className="custom-class-162">
                <p className="s7 custom-class-962">QUANTITY</p>
              </td>
              <td className="custom-class-540">
                <p className="s7 custom-class-825">RATE</p>
              </td>
              <td className="custom-class-240">
                <p className="s7 custom-class-919">
                  AMOUNT<span className="s8"> </span>IN
                  <span className="s8"> </span>Currency
                </p>
              </td>
            </tr>
            <tr className="custom-class-878">
              <td className="custom-class-570">
                <p className="custom-class-59">
                  <br />
                </p>
                <p className="s12 custom-class-236">1</p>
              </td>
              <td className="custom-class-558">
                <p className="custom-class-650">
                  <br />
                </p>
                <p className="s12 custom-class-427">{month}</p>
              </td>
              <td className="custom-class-632">
                <p className="custom-class-864">
                  <br />
                </p>
                <p className="s12 custom-class-974">70205</p>
              </td>
              <td className="custom-class-950">
                <p className="custom-class-882">
                  <br />
                </p>
              </td>
              <td className="custom-class-232">
                <p className="custom-class-443">
                  <br />
                </p>
              </td>
              <td className="custom-class-454">
                <p className="custom-class-722">
                  <br />
                </p>
                <p className="s12 custom-class-598">{amount}</p>
              </td>
            </tr>
            <tr className="custom-class-392">
              <td colSpan={3} className="custom-class-418">
                <p className="s12 custom-class-474">
                  Amount<span className="s4"> </span>in
                  <span className="s4"> </span>Words
                </p>
              </td>
              <td colSpan={2} className="custom-class-935">
                <p className="s3 custom-class-52">
                  [A]<span className="s4"> </span>TOTAL
                </p>
              </td>
              <td className="custom-class-958">
                <p className="s12 custom-class-680">{amount}</p>
              </td>
            </tr>
            <tr className="custom-class-18">
              <td colSpan={2} className="custom-class-811">
                <p className="s12 custom-class-469">
                  Amount<span className="s4"> </span>of
                  <span className="s4"> </span>Tax<span className="s4"></span>
                  subject<span className="s4"> </span>to
                  <span className="s4"> </span>Reverse
                  <span className="s4"> </span>Charges
                </p>
              </td>
              <td className="custom-class-674">
                <p className="s3 custom-class-293">No</p>
              </td>
              <td colSpan={2} className="custom-class-276">
                <p className="custom-class-50">
                  <br />
                </p>
              </td>
              <td className="custom-class-915">
                <p className="custom-class-945">
                  <br />
                </p>
              </td>
            </tr>
            <tr className="custom-class-312">
              <td colSpan={3} className="custom-class-315">
                <p className="s13 custom-class-213">
                  Terms<span className="s6"> </span>and
                  <span className="s6"> </span>Conditions:
                </p>
                <ol id="l1">
                  <li data-list-text={1}>
                    <p className="s5 custom-class-662">
                      All<span className="s6"> </span>disputes
                      <span className="s6"> </span>related
                      <span className="s6"> </span>to
                      <span className="s6"> </span>this
                      <span className="s6"> </span>Invoice
                      <span className="s6"> </span>and/or
                      <span className="s6"> </span>Insertion/Release
                      <span className="s6"></span>order
                      <span className="s6"> </span>mentioned
                      <span className="s6"></span>will
                      <span className="s6"> </span>be
                      <span className="s6"> </span>subject
                      <span className="s6"> </span>to
                      <span className="s6"> </span>the
                      <span className="s6"> </span>Jurisdiction
                      <span className="s6"></span>of
                      <span className="s6"> </span>honorable
                      <span className="s6"> </span>court
                      <span className="s6"> </span>in
                      <span className="s6"> </span>Delhi,
                      <span className="s6"> </span>India
                      <span className="s6"> </span>only
                    </p>
                  </li>
                  <li data-list-text={2}>
                    <p className="s3 custom-class-849">
                      Payments<span className="s4"> </span>to
                      <span className="s4"> </span>be
                      <span className="s4"> </span>made
                      <span className="s4"> </span>in
                      <span className="s4"> </span>the
                      <span className="s4"> </span>below
                      <span className="s4"> </span>account
                    </p>
                  </li>
                </ol>
              </td>
              <td colSpan={3} rowSpan={2} className="custom-class-668">
                <p className="custom-class-393">
                  <br />
                </p>
                <p className="s13 custom-class-924">
                  [E]<span className="s6"> </span>GRAND
                  <span className="s6"> </span>TOTAL
                  <span className="s6"> </span>Total
                </p>
                <p className="s13 custom-class-821">E&amp;OE</p>
              </td>
            </tr>
            <tr className="custom-class-836">
              <td colSpan={3} rowSpan={2} className="custom-class-774">
                <div className="flex justify-between gap-8">
                  {/* USD Account Details (Left) */}
                  <div className="w-1/2">
                    <p className="s14 custom-class-559">USD Account Details</p>
                    <p className="s4 custom-class-194">
                      <span className="s12">Account holder</span>
                      <span className="s3">: Click Orbits Pte. Ltd.</span>
                      <span className="s12"> Routing number</span>
                      <span className="s3">: 026073150</span>
                      <span className="s12"> <br/>Swift/BIC</span>
                      <span className="s3">: CMFGUS33</span>
                    </p>
                    <p className="s12 custom-class-194">
                      Account number<span className="s3">: 8314363233</span>
                    </p>

                    <p className="s4 custom-class-784">
                      <span className="s12">Wise's address</span>
                      <span className="s3">
                        : 30 W. 26th Street, Sixth Floor New York NY 10010
                        United
                      </span>
                    </p>

                    <ol id="l2">
                      <li data-list-text={3}>
                        <p className="s5 custom-class-401">
                          The Invoice is considered accepted if no discrepancy
                          is reported within 5 business days of receipt of the
                          Invoice and payment is to be made in full
                        </p>
                      </li>
                      <li data-list-text={4}>
                        <p className="s5 custom-class-862">
                          In case of any discrepancy or questions regarding this
                          invoice, please contact accounting and/or your account
                          manager ASAP
                        </p>
                      </li>
                    </ol>
                  </div>

                  {/* EURO Account Details (Right) */}
                  <div className="w-1/2">
                    <p className="s12 font-semibold mb-2">
                      EURO Account Details
                    </p>
                    <p className="s4 custom-class-194">
                      <span className="s12">Name</span>
                      <span className="s3">: Click Orbits Pte. Ltd. <br/></span>
                      <span className="s12"> IBAN</span>
                      <span className="s3">: BE25 9679 6422 0782</span>
                      <span className="s12"><br/> Swift/BIC:</span>
                      <span className="s3">: TRWIBEB1XXX</span>
                    </p>
                    <p className="s12 custom-class-194">
                      Address
                      <span className="s3">
                        : Wise, Rue du Trône 100, 3rd floor, Brussels, 1050,
                        Belgium
                      </span>
                    </p>
                  </div>
                </div>
              </td>
            </tr>

            <tr className="custom-class-572">
              <td colSpan={3} className="custom-class-254">
                <p className="custom-class-625">
                  <br />
                </p>
                <p className="s13 custom-class-356">
                  CLICK<span className="s6"> </span>ORBITS
                  <span className="s6"> </span>PTE<span className="s6"> </span>
                  LTD
                </p>
              </td>
            </tr>
            <tr className="custom-class-566">
              <td colSpan={6} className="custom-class-291">
                <p className="s15 custom-class-299">
                  *This<span className="s6"> </span>is
                  <span className="s6"> </span>a<span className="s6"></span>
                  computer<span className="s6"> </span>generated
                  <span className="s6"></span>Invoice
                  <span className="s6"> </span>and<span className="s6"> </span>
                  does<span className="s6"> </span>not
                  <span className="s6"> </span>require
                  <span className="s6"> </span>signature*
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InvoiceComponent;
