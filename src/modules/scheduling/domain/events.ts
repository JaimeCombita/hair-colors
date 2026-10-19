export interface AppointmentCreatedEvent {
  type: "appointment.created";
  appointmentId: string;
  staffId: string;
  serviceId: string;
  customerId: string;
  startsAt: Date;
  endsAt: Date;
}

export type SchedulingEvent = AppointmentCreatedEvent;

export interface SchedulingEventPublisher {
  publish(event: SchedulingEvent): Promise<void>;
}
