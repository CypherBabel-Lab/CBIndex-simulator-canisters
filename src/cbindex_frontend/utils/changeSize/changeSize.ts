import { useEffect, useState, useCallback } from "react";
function changeSize() {
    if (typeof window !== "undefined") {
        const [size, setSize] = useState({
            width: document.documentElement.clientWidth,
            hieght: document.documentElement.clientHeight,
        });

        const onResize = useCallback(() => {
            setSize({
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            } as any);
        }, []);

        useEffect(() => {
            window.addEventListener("resize", onResize);
            return () => {
                window.removeEventListener("resize", onResize);
            };
        }, []);

        return size;
    }
}
export default changeSize