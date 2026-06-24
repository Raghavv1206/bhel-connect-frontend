import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceApi } from '../../api/marketplace';
import { validateImage } from '../../utils/validateImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Upload, X, ShieldCheck } from 'lucide-react';

const SellProductPage = () => {
  const navigate = useNavigate();

  // Form Steps: 1 = Category, 2 = Core Fields, 3 = Images, 4 = Extras (optional), 5 = Review
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Values
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('good');
  const [images, setImages] = useState([]);
  
  // Extra fields: Vehicle
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleKm, setVehicleKm] = useState('');
  const [vehicleFuel, setVehicleFuel] = useState('petrol');
  const [vehicleTrans, setVehicleTrans] = useState('manual');
  
  // Extra fields: Property
  const [propertyLoc, setPropertyLoc] = useState('');
  const [propertyArea, setPropertyArea] = useState('');
  const [propertyBeds, setPropertyBeds] = useState('2');
  const [propertyBaths, setPropertyBaths] = useState('2');
  const [propertyType, setPropertyType] = useState('apartment');
  const [propertyListType, setPropertyListType] = useState('rent');

  // Load categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await marketplaceApi.getCategories();
        const list = data.results || (Array.isArray(data) ? data : []);
        setCategories(list);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }

    const validatedFiles = [];
    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      validatedFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setImages((prev) => [...prev, ...validatedFiles]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const isVehicle = selectedCategory?.slug === 'vehicles' || selectedCategory?.parent?.slug === 'vehicles';
  const isProperty = selectedCategory?.slug === 'properties' || selectedCategory?.parent?.slug === 'properties';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('condition', condition);
      formData.append('category_id', selectedCategory.id);

      images.forEach((img) => {
        formData.append('images', img.file);
      });

      if (isVehicle) {
        formData.append('vehicle_brand', vehicleBrand);
        formData.append('vehicle_model', vehicleModel);
        formData.append('vehicle_year', vehicleYear);
        formData.append('vehicle_km_driven', vehicleKm);
        formData.append('vehicle_fuel_type', vehicleFuel);
        formData.append('vehicle_transmission', vehicleTrans);
      }

      if (isProperty) {
        formData.append('property_location', propertyLoc);
        formData.append('property_area_sqft', propertyArea);
        formData.append('property_bedrooms', propertyBeds);
        formData.append('property_bathrooms', propertyBaths);
        formData.append('property_property_type', propertyType);
        formData.append('property_listing_type', propertyListType);
      }

      await marketplaceApi.createListing(formData);
      toast.success('Listing created successfully! Under moderator review.');
      navigate('/marketplace');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create listing. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Steps indicator */}
      <div className="mb-8 relative flex items-center justify-between px-2 sm:px-4 select-none">
        {/* Progress Line */}
        <div className="absolute left-[24px] right-[24px] top-[14px] sm:top-[16px] h-0.5 bg-gray-200 -z-10 rounded" />
        <div 
          className="absolute left-[24px] right-[24px] top-[14px] sm:top-[16px] h-0.5 bg-[#003366] -z-10 rounded transition-all duration-300"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        />
        
        {[
          { label: 'Category', num: 1 },
          { label: 'Core Info', num: 2 },
          { label: 'Images', num: 3 },
          { label: 'Extras', num: 4 },
          { label: 'Review', num: 5 }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center">
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all duration-300 ${
                step >= s.num 
                  ? 'bg-[#003366] border-[#003366] text-white shadow-sm' 
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {s.num}
            </div>
            <span 
              className={`mt-1.5 text-[9px] sm:text-xs font-bold tracking-wider uppercase transition-colors duration-300 ${
                step === s.num
                  ? 'text-[#003366] font-extrabold'
                  : step > s.num
                  ? 'text-gray-600'
                  : 'text-gray-400'
              } ${step === s.num ? 'block' : 'hidden sm:block'}`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-250 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* STEP 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#003366]">Select a Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border text-left font-bold transition-all hover:bg-blue-50 cursor-pointer ${
                    selectedCategory?.id === cat.id ? 'border-[#003366] bg-blue-50/50 text-[#003366]' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Core Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#003366]">Core Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  placeholder="e.g. Dell Inspiron Laptop 15-inch"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  placeholder="e.g. 15000"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  placeholder="Describe your item details, age, condition, reasons for sale..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Condition</label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {['new', 'like_new', 'good', 'fair'].map((cond) => (
                    <label key={cond} className="flex items-center gap-1.5 text-sm cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={condition === cond}
                        onChange={(e) => setCondition(e.target.value)}
                      />
                      {cond.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!title || !price || !description}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] hover:bg-blue-850 text-white rounded-lg text-sm font-bold disabled:bg-gray-300 cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Image Upload */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#003366]">Upload Photos</h2>
            <p className="text-xs text-gray-500">Upload up to 5 clear photos of your item. Only JPEG, PNG, WEBP are accepted. Max 5MB per photo.</p>
            
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="h-28 bg-gray-50 rounded-xl relative overflow-hidden border border-gray-200">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="h-28 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep((isVehicle || isProperty) ? 4 : 5)}
                disabled={images.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] hover:bg-blue-850 text-white rounded-lg text-sm font-bold disabled:bg-gray-300 cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Extras (Vehicles & Properties Only) */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#003366]">Additional Attributes</h2>

            {isVehicle && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Brand</label>
                    <input type="text" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. Maruti Suzuki" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Model</label>
                    <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. Swift" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Manufacturing Year</label>
                    <input type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. 2018" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">KM Driven</label>
                    <input type="number" value={vehicleKm} onChange={(e) => setVehicleKm(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. 45000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fuel Type</label>
                    <select value={vehicleFuel} onChange={(e) => setVehicleFuel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="cng">CNG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Transmission</label>
                    <select value={vehicleTrans} onChange={(e) => setVehicleTrans(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isProperty && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Location / Locality</label>
                  <input type="text" value={propertyLoc} onChange={(e) => setPropertyLoc(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. BHEL Township, Sector 2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Super Area (sqft)</label>
                    <input type="number" value={propertyArea} onChange={(e) => setPropertyArea(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. 1200" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Property Type</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                      <option value="apartment">Apartment</option>
                      <option value="house">Independent House</option>
                      <option value="villa">Villa</option>
                      <option value="plot">Plot</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">BHK</label>
                    <input type="number" value={propertyBeds} onChange={(e) => setPropertyBeds(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Baths</label>
                    <input type="number" value={propertyBaths} onChange={(e) => setPropertyBaths(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Purpose</label>
                    <select value={propertyListType} onChange={(e) => setPropertyListType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] hover:bg-blue-850 text-white rounded-lg text-sm font-bold cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review Summary and Submit */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#003366]">Review and Submit</h2>
            
            <div className="border border-gray-150 rounded-xl p-5 space-y-4 bg-gray-50">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Category</span>
                <span className="text-sm font-bold text-gray-800">{selectedCategory?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Title</span>
                <span className="text-sm font-bold text-gray-800">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Price</span>
                <span className="text-sm font-bold text-[#003366]">₹{price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Condition</span>
                <span className="text-sm font-bold text-gray-800 capitalize">{condition.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Photos Selected</span>
                <span className="text-sm font-bold text-gray-800">{images.length}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-amber-850 bg-amber-50 border border-amber-150 rounded-lg p-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>By submitting, you agree that your listing details are accurate. Listings go live immediately after administrator moderation and approval to ensure BHEL workspace compliance.</span>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep((isVehicle || isProperty) ? 4 : 3)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold disabled:bg-gray-300 shadow-sm transition-colors cursor-pointer"
              >
                {loading ? <LoadingSpinner size="small" /> : 'Submit for Moderation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellProductPage;
