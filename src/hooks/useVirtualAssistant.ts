import { useSetAtom } from 'jotai';
import { virtualAssistantOpenAtom, virtualAssistantShowAssistantAtom, virtualAssistantStartInputAtom } from '../state/atoms/virtualAssistantAtom';

const useVirtualAssistant = () => {
  const setOpen = useSetAtom(virtualAssistantOpenAtom);
  const setStartInput = useSetAtom(virtualAssistantStartInputAtom);
  const setShowAssistant = useSetAtom(virtualAssistantShowAssistantAtom);
  const openVA = (startInput: string) => {
    setStartInput(startInput);
    // setStartInput(`Contact my org admin for access to ${window.location.pathname}.`)
    setOpen(true);
    setShowAssistant(true); // Ensure the assistant is shown
  };

  return {
    openVA,
  };
};

export default useVirtualAssistant;
