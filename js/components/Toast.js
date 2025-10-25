/**
 * Toast Notification Component
 *
 * Auto-dismissing notification that appears for 3 seconds.
 *
 * @param {Object} props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type of toast ('success' or 'error')
 * @param {Function} props.onClose - Callback when toast closes
 */

const { useEffect } = React;

export function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast ${type}`}>
            <i className={`fas ${type === 'success' ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-red-600'} text-xl`}></i>
            <span className="font-medium">{message}</span>
        </div>
    );
}
