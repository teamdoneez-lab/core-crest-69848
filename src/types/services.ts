export interface Service {
  id: string;
  name: string;
}

export interface SubItem {
  title: string;
  services: Service[];
}

export interface AccordionData {
  title: string;
  subItems: SubItem[];
}
