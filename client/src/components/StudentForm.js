// client/src/components/StudentForm.js
import React, { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import { GLOBAL_LOCATIONS, getCountries, getCities, getCountryByCity } from "../data/locations";
import HybridSelect from "./HybridSelect";
import LibraryProfileView from "./library/LibraryProfileView";
import ActionGuard from "../utils/ActionGuard";
import "../App.css";

try {
  if (process.env.NODE_ENV !== 'test') Modal.setAppElement("#root");
} catch (e) {
  console.warn("Modal.setAppElement failed (safely ignored in test)", e.message);
}

const INITIAL_STATE = {
  name: "",
  email: "",
  phone: "",
  course: "",
  enrollmentDate: "",
  status: "Active",
  address: "",
  city: "",
  country: "",
  zipCode: "",
  gpa: "",
  // ENTERPRISE FIELDS
  guardianName: "",
  emergencyContact: "",
  studentCategory: "Local",
  scholarshipStatus: "None",
  bloodGroup: "",
  hostelRequired: false,
  transportMode: "Private"
};

function StudentForm({ isOpen, onRequestClose, onSubmit, student, submitting }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [activeSection, setActiveSection] = useState(1); // 1, 2, 3
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Reset form when modal opens/closes or student changes
  useEffect(() => {
    if (isOpen) {
      if (student) {
        setFormData({ ...INITIAL_STATE, ...student }); // Merge to ensure new fields exist
      } else {
        setFormData(INITIAL_STATE);
      }
      setErrors({});
      setTouched({});
      setActiveSection(1);
    }
  }, [isOpen, student]);

  // --- VALIDATION ENGINE 2.0 ---
  const validateField = (name, value, currentFormData = formData) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) error = "Full name is required";
        else if (value.length < 2) error = "Name must be at least 2 characters";
        break;

      case "email":
        if (!value.trim()) error = "Email address is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Please enter a valid email address";
        break;

      case "phone":
        if (value && !/^[\d\-+\s()]{7,20}$/.test(value)) error = "Invalid phone format";
        break;

      case "gpa":
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0 || num > 10.0) error = "GPA must be between 0.0 and 10.0";
        }
        break;

      case "country":
        if (activeSection === 3 && !value) error = "Country selection is required";
        break;

      case "city":
        if (activeSection === 3 && !value) error = "City selection is required";
        break;

      case "zipCode":
        if (value && currentFormData.country && GLOBAL_LOCATIONS[currentFormData.country]) {
          const locData = GLOBAL_LOCATIONS[currentFormData.country];
          if (!locData.zipRegex.test(value)) {
            error = `Invalid format. Example: ${locData.zipHint}`;
          }
        }
        break;

      case "bloodGroup":
        const validGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        if (value && !validGroups.includes(value)) {
          error = "Invalid selection";
        }
        break;

      default:
        break;
    }
    return error;
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const finalValue = type === 'checkbox' ? checked : value;

    let updatedData = { ...formData, [name]: finalValue };

    // Auto-Detect Country from City (integrated here to prevent infinite loops)
    if (name === 'city' && !updatedData.country && value.length > 2) {
      const detectedCountry = getCountryByCity(value);
      if (detectedCountry) {
        updatedData.country = detectedCountry;
      }
    }

    // Strict Location Logic
    if (name === "country") {
      updatedData.city = "";
      updatedData.zipCode = "";
    }

    setFormData(updatedData);

    // Real-time validation if field was already touched
    if (touched[name]) {
      const error = validateField(name, finalValue, updatedData);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Final Validation of ALL fields
    const newErrors = {};
    let isValid = true;
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (!isValid) return;

    // Sanitize payload for Hard Integrity (Remove internal & computed fields)
    const payload = { ...formData };

    // Internal MongoDB/Mongoose fields
    const internalFields = ['_id', '__v', 'createdAt', 'updatedAt'];
    // Computed Aggregation fields (from StudentService.js)
    const computedFields = ['borrowedBooksCount', 'hasOverdue', 'lastBorrowDate', 'transactions'];

    [...internalFields, ...computedFields].forEach(field => delete payload[field]);

    if (!payload.enrollmentDate) delete payload.enrollmentDate;
    if (payload.gpa === "") delete payload.gpa;

    onSubmit(payload);
  };

  // Accordion Navigation
  const goToSection = (sectionNum) => {
    // Basic validation strictness increases with activeSection
    setActiveSection(sectionNum);
  };

  // Helper helper to get cities
  const availableCities = useMemo(() => {
    return getCities(formData.country);
  }, [formData.country]);

  // Helper helper to get zip hint
  const zipHint = useMemo(() => {
    return formData.country && GLOBAL_LOCATIONS[formData.country] ? GLOBAL_LOCATIONS[formData.country].zipHint : "";
  }, [formData.country]);

  // Memoize Country List to prevent unnecessary re-renders in HybridSelect
  const countryOptions = useMemo(() => getCountries(), []);

  // --- COMPONENT RENDER HELPER ---
  const renderFloatingInput = (name, label, type = "text", required = false, props = {}) => {
    const { gridSpan, ...restProps } = props;
    return (
      <div className={`form-group floating-label-group ${gridSpan || ''}`}>
        <input
          type={type}
          id={name}
          name={name}
          className={`floating-input ${errors[name] && touched[name] ? 'has-error' : ''}`}
          placeholder=" "
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          {...restProps}
        />
        <label htmlFor={name} className="floating-label">
          {label} {required && <span className="required-star">*</span>}
        </label>
        {errors[name] && touched[name] && (
          <div className="error-text"><span>⚠️</span> {errors[name]}</div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Student Form"
      className="modal"
      overlayClassName="overlay"
      shouldCloseOnOverlayClick={false}
    >

      <div className="modal-header">
        <h2>{student ? "Edit Student Profile" : "New Student Entry"}</h2>
        <button className="button-icon" onClick={onRequestClose} aria-label="Close">✕</button>
      </div>

      <ActionGuard
        actionKey={student ? "STUDENT_UPDATE" : "STUDENT_CREATE"}
        handler={handleSubmit}
        role="ADMIN"
      >
        <form id="studentForm" className="form modal-content-scroll">

          {/* === SECTION 1: PERSONAL INFORMATION === */}
          <div className={`accordion-section ${activeSection === 1 ? 'active' : ''}`}>
            <div className="accordion-header" onClick={() => goToSection(1)}>
              <h3>Personal Information</h3>
              <span className="accordion-icon">{activeSection === 1 ? '−' : '+'}</span>
            </div>
            {activeSection === 1 && (
              <div className="accordion-content message-grid fade-in">
                {renderFloatingInput("name", "Full Name", "text", true, { autoFocus: true, gridSpan: "grid-span-2" })}
                {renderFloatingInput("email", "Email Address", "email", true, { disabled: !!student, title: student ? "Email cannot be changed" : "" })}
                {renderFloatingInput("phone", "Phone Number", "tel")}

                {/* ENTERPRISE FIELDS */}
                {renderFloatingInput("guardianName", "Guardian Name", "text")}
                {renderFloatingInput("emergencyContact", "Emergency Contact", "tel")}

                {/* Blood Group Dropdown - Strict Selection */}
                <div className="form-group floating-label-group">
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    className={`floating-input ${errors.bloodGroup && touched.bloodGroup ? 'has-error' : ''}`}
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">Select...</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {/* Fixed Overlap: Locked floating label for Select used to prevent collision */}
                  <label htmlFor="bloodGroup" className="floating-label" style={{ top: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>Blood Group</label>
                  {errors.bloodGroup && touched.bloodGroup && (
                    <div className="error-text"><span>⚠️</span> {errors.bloodGroup}</div>
                  )}
                </div>

                <div className="form-actions-right">
                  <button type="button" className="button button-submit" onClick={() => goToSection(2)}>Next ➔</button>
                </div>
              </div>
            )}
          </div>

          {/* === SECTION 2: ACADEMIC RECORDS === */}
          <div className={`accordion-section ${activeSection === 2 ? 'active' : ''}`}>
            <div className="accordion-header" onClick={() => goToSection(2)}>
              <h3>Academic Details</h3>
              <span className="accordion-icon">{activeSection === 2 ? '−' : '+'}</span>
            </div>
            {activeSection === 2 && (
              <div className="accordion-content message-grid fade-in">
                {renderFloatingInput("course", "Assigned Course", "text")}
                {renderFloatingInput("gpa", "Current GPA", "number", false, { min: "0", max: "10", step: "0.01" })}

                {/* Status */}
                <div className="form-group floating-label-group">
                  <select id="status" name="status" className="floating-input" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <label className="floating-label" style={{ top: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>Academic Status</label>
                </div>

                {/* Category */}
                <div className="form-group floating-label-group">
                  <select id="studentCategory" name="studentCategory" className="floating-input" value={formData.studentCategory} onChange={handleChange}>
                    <option value="Local">Local</option>
                    <option value="International">International</option>
                    <option value="Exchange">Exchange Program</option>
                  </select>
                  <label className="floating-label" style={{ top: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>Category</label>
                </div>

                {/* Scholarship */}
                <div className="form-group floating-label-group">
                  <select id="scholarshipStatus" name="scholarshipStatus" className="floating-input" value={formData.scholarshipStatus} onChange={handleChange}>
                    <option value="None">None</option>
                    <option value="Partial">Partial</option>
                    <option value="Full">Full Ride</option>
                  </select>
                  <label className="floating-label" style={{ top: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>Scholarship</label>
                </div>

                <div className="form-actions-right">
                  <button type="button" className="button button-cancel" onClick={() => goToSection(1)}>Back</button>
                  <button type="button" className="button button-submit" onClick={() => goToSection(3)}>Next ➔</button>
                </div>
              </div>
            )}
          </div>

          {/* === SECTION 3: LOCATION & LOGISTICS === */}
          <div className={`accordion-section ${activeSection === 3 ? 'active' : ''}`}>
            <div className="accordion-header" onClick={() => goToSection(3)}>
              <h3>Location & Logistics</h3>
              <span className="accordion-icon">{activeSection === 3 ? '−' : '+'}</span>
            </div>
            {activeSection === 3 && (
              <div className="accordion-content message-grid fade-in">
                {/* Country & City with Hybrid Select */}
                <HybridSelect
                  label="Country"
                  name="country"
                  options={countryOptions}
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.country && touched.country ? errors.country : null}
                  required
                />

                <HybridSelect
                  label="City"
                  name="city"
                  options={availableCities}
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!formData.country}
                  error={errors.city && touched.city ? errors.city : null}
                  required
                />
                {/* <div style={{ padding: '20px', border: '1px solid red' }}>HybridSelect Disabled for Debugging</div> */}

                {renderFloatingInput("zipCode", `Zip Code ${zipHint ? `(${zipHint})` : ""}`, "text", false, { disabled: !formData.country })}
                {renderFloatingInput("address", "Street Address", "text", false, { gridSpan: "grid-span-3" })}

                {/* Transport Checkboxes / Radio */}
                <div className="form-group" style={{ gridColumn: "span 3", display: "flex", gap: "20px", alignItems: "center", marginTop: "10px" }}>
                  <label style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Transport Mode:</label>
                  {["Bus", "Private", "Walk"].map(mode => (
                    <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="transportMode"
                        value={mode}
                        checked={formData.transportMode === mode}
                        onChange={handleChange}
                      />
                      {mode}
                    </label>
                  ))}
                </div>

                {/* Hostel Toggle */}
                <div className="form-group" style={{ gridColumn: "span 3", marginTop: "10px" }}>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="hostelRequired"
                      checked={formData.hostelRequired}
                      onChange={handleChange}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span style={{ marginLeft: "10px", fontWeight: 600 }}>Hostel Accommodation Required</span>
                </div>

                <div className="form-actions-right">
                  <button type="button" className="button button-cancel" onClick={() => goToSection(2)}>Back</button>
                </div>
              </div>
            )}
          </div>

          {/* === SECTION 4: LIBRARY ACTIVITY (ENTERPRISE) === */}
          <div className={`accordion-section ${activeSection === 4 ? 'active' : ''}`}>
            <div className="accordion-header" onClick={() => goToSection(4)}>
              <h3>Library Activity</h3>
              <span className="accordion-icon">{activeSection === 4 ? '−' : '+'}</span>
            </div>
            {activeSection === 4 && (
              <div className="accordion-content fade-in">
                {!student ? (
                  <div className="empty-state">Save student first to view library data.</div>
                ) : (
                  <LibraryProfileView studentId={student._id} />
                )}
              </div>
            )}
          </div>

        </form>
      </ActionGuard>

      <div className="modal-footer">
        <button type="button" className="button button-cancel" onClick={onRequestClose}>Cancel</button>
        <button
          type="submit"
          form="studentForm"
          className="button button-submit"
          disabled={submitting}
        >
          {submitting ? "Processing..." : (student ? "Save Records" : "Create Entry")}
        </button>
      </div>
    </Modal>
  );
}

export default StudentForm;
