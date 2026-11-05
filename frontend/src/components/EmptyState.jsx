import { FaRegCalendarXmark } from 'react-icons/fa6';

export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><FaRegCalendarXmark /></span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
