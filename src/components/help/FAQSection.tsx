import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I create a new rental agreement?",
    answer: "To create a new rental agreement, navigate to the Agreements page and click the 'Create Agreement' button. Fill in the required information including customer details, vehicle selection, and rental terms. Review the information and submit the form to create the agreement."
  },
  {
    question: "How can I track vehicle maintenance?",
    answer: "Vehicle maintenance can be tracked through the Maintenance section. You can view scheduled maintenance, create new maintenance records, and track service history for each vehicle in your fleet."
  },
  {
    question: "How do I generate reports?",
    answer: "Navigate to the Reports & Analytics page where you can generate various reports including fleet status, financial reports, and customer analytics. Select the desired report type and date range, then click 'Generate Report'."
  },
  {
    question: "How do I manage customer profiles?",
    answer: "Customer profiles can be managed through the Customers page. You can add new customers, update existing information, view rental history, and manage documents associated with each customer."
  },
  {
    question: "How do I handle vehicle inspections?",
    answer: "Vehicle inspections are managed through the Vehicles section. You can create new inspection records, upload photos, document damage, and generate inspection reports for both check-in and check-out processes."
  }
];

export const FAQSection = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};