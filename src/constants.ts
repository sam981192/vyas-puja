export const LANGUAGES = ['English', 'Hindi', 'Other'];

export const ISKCON_LOCATIONS: Record<string, string[]> = {
  // --- States ---
  'Andhra Pradesh': ['Tirupati', 'Vijayawada', 'Visakhapatnam', 'Nellore', 'Anantapur', 'Guntur', 'Kakinada', 'Rajahmundry', 'Kurnool'],
  'Arunachal Pradesh': ['Itanagar'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Nagaon'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg'],
  'Delhi': ['East of Kailash', 'Punjabi Bagh', 'Rohini', 'Dwarka', 'Chanakyapuri', 'Lajpat Nagar'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Gujarat': ['Ahmedabad', 'Baroda (Vadodara)', 'Surat', 'Rajkot', 'Vallabh Vidyanagar', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Junagadh'],
  'Haryana': ['Kurukshetra', 'Panchkula', 'Faridabad', 'Rohtak', 'Gurgaon', 'Karnal', 'Panipat', 'Hisar', 'Ambala'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi'],
  'Jammu and Kashmir': ['Jammu', 'Udhampur', 'Srinagar'],
  'Jharkhand': ['Jamshedpur', 'Ranchi', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bangalore', 'Hubli', 'Mangalore', 'Belgaum', 'Mysore (Mysuru)', 'Gulbarga (Kalaburagi)', 'Davangere', 'Bellary', 'Shimoga', 'Udupi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode (Calicut)', 'Thrissur', 'Kannur', 'Alappuzha', 'Palakkad'],
  'Madhya Pradesh': ['Ujjain', 'Indore', 'Gwalior', 'Bhopal', 'Jabalpur', 'Rewa', 'Sagar', 'Satna', 'Dewas'],
  'Maharashtra': ['Mumbai (Juhu)', 'Mumbai (Chowpatty)', 'Mumbai (Mira Road)', 'Mumbai (Kharghar)', 'Pune', 'Nagpur', 'Nasik', 'Pandharpur', 'Aurangabad', 'Kolhapur', 'Solapur', 'Thane', 'Navi Mumbai'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong'],
  'Mizoram': ['Aizawl'],
  'Nagaland': ['Dimapur', 'Kohima'],
  'Odisha': ['Bhubaneswar', 'Puri', 'Cuttack', 'Berhampur', 'Rourkela'],
  'Punjab': ['Ludhiana', 'Chandigarh', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Bikaner', 'Udaipur', 'Ajmer', 'Kota', 'Alwar', 'Bharatpur', 'Sri Ganganagar'],
  'Sikkim': ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Salem', 'Madurai', 'Tiruchirappalli (Trichy)', 'Tirunelveli', 'Vellore', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Secunderabad'],
  'Tripura': ['Agartala'],
  'Uttar Pradesh': ['Vrindavan', 'Kanpur', 'Noida', 'Lucknow', 'Varanasi', 'Ghaziabad', 'Agra', 'Mathura', 'Allahabad (Prayagraj)', 'Meerut', 'Bareilly', 'Aligarh', 'Gorakhpur', 'Jhansi'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani'],
  'West Bengal': ['Mayapur', 'Kolkata', 'Siliguri', 'Durgapur', 'Asansol', 'Howrah'],

  // --- Union Territories ---
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa'],
  'Ladakh': ['Leh'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry'],
};


export const OFFERING_FORMATS = [
  { id: 'text', label: 'Text Offering' },
  { id: 'audio', label: 'Audio' },
  { id: 'image', label: 'Image' },
  { id: 'document', label: 'Document (PDF/DOC)' },
  { id: 'ppt', label: 'PPT' },
];

export const ASHRAYS = [
  'HH Gopal Krishna Goswami Maharaj',
  'HH Lokanath Swami Maharaj',
  'HH Radhanath Swami Maharaj',
  'HH Jayapataka Swami Maharaj',
  'Other'
];

export const STATES = [
  ...Object.keys(ISKCON_LOCATIONS).sort(),
  'Other'
];
