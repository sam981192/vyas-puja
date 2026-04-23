export const LANGUAGES = ['English', 'Hindi', 'Other'];

export const ISKCON_LOCATIONS: Record<string, string[]> = {
  'Andhra Pradesh': ['Tirupati', 'Vijayawada', 'Visakhapatnam', 'Nellore', 'Anantapur'],
  'Assam': ['Guwahati'],
  'Bihar': ['Patna'],
  'Chhattisgarh': ['Raipur', 'Bhilai'],
  'Delhi': ['East of Kailash', 'Punjabi Bagh', 'Rohini', 'Dwarka', 'Chanakyapuri'],
  'Gujarat': ['Ahmedabad', 'Baroda', 'Surat', 'Rajkot', 'Vallabh Vidyanagar'],
  'Haryana': ['Kurukshetra', 'Panchkula', 'Rohtak'],
  'Himachal Pradesh': ['Shimla'],
  'Jammu and Kashmir': ['Jammu', 'Udhampur'],
  'Jharkhand': ['Jamshedpur'],
  'Karnataka': ['Bangalore', 'Hubli', 'Mangalore', 'Belgaum'],
  'Kerala': ['Kochi', 'Thiruvananthapuram'],
  'Madhya Pradesh': ['Ujjain', 'Indore', 'Gwalior', 'Bhopal', 'Jabalpur'],
  'Maharashtra': ['Mumbai (Juhu)', 'Mumbai (Chowpatty)', 'Mumbai (Mira Road)', 'Mumbai (Kharghar)', 'Pune', 'Nagpur', 'Nasik', 'Pandharpur'],
  'Odisha': ['Bhubaneswar', 'Puri'],
  'Punjab': ['Ludhiana', 'Chandigarh'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Bikaner'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Salem', 'Madurai'],
  'Telangana': ['Hyderabad'],
  'Uttar Pradesh': ['Vrindavan', 'Mayapur', 'Kanpur', 'Noida', 'Lucknow', 'Varanasi', 'Ghaziabad', 'Agra'],
  'West Bengal': ['Mayapur', 'Kolkata', 'Siliguri'],
};

export const STATES = Object.keys(ISKCON_LOCATIONS).sort();

export const OFFERING_FORMATS = [
  { id: 'text', label: 'Text Offering' },
  { id: 'audio', label: 'Audio' },
  { id: 'image', label: 'Image' },
  { id: 'document', label: 'Document (PDF/DOC)' },
  { id: 'ppt', label: 'PPT' },
];
