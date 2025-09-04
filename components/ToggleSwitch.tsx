import React from 'react';

interface ToggleSwitchProps {
    isOn: boolean;
    handleToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, handleToggle }) => {
    return (
        <div
            onClick={handleToggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${
                isOn ? 'bg-brand-primary' : 'bg-brand-surface'
            }`}
            role="switch"
            aria-checked={isOn}
        >
            <div
                className={`bg-white h-4 w-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                    isOn ? 'translate-x-6' : 'translate-x-0'
                }`}
            />
        </div>
    );
};

export default ToggleSwitch;
