export interface DoctorResult {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating?: number;
  reviews?: number;
  website?: string;
  accepting_patients: boolean;
  distance?: string;
  source: string;
}
