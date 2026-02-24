import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLoadScript, Autocomplete, GoogleMap, MarkerF, PolylineF, PolygonF } from "@react-google-maps/api";
import { FaSearch } from "react-icons/fa";
import { FaRulerHorizontal, FaDrawPolygon, FaTrashAlt, FaTimes } from "react-icons/fa";
import { LocationData, DynamicCard } from '../../../../types/evidence';

interface LocationCardProps {
    card: DynamicCard;
    onDataChange: (cardId: string, updatedData: Partial<LocationData>) => void;
    isEditing: boolean;
}

const libraries: ("places" | "drawing" | "geometry")[] = ["places", "drawing", "geometry"];
const defaultCenter = { lat: 13.736717, lng: 100.523186 };
const DEFAULT_ZOOM = 15;
const SEARCH_ZOOM = 15;

const LocationCard: React.FC<LocationCardProps> = ({
    card,
    onDataChange,
    isEditing,
}) => {
    const initialData: LocationData = card.data as LocationData;
    const initialLat = initialData?.lat ?? null;
    const initialLng = initialData?.lng ?? null;
    const rawApiCoordinates: [number, number][] = (initialData?.coordinates || []) as [number, number][];
    const detectedInitialLocationType: 'แบบระบุตำแหน่ง' | 'แบบระบุพื้นที่' =
        rawApiCoordinates.length > 1 ? 'แบบระบุพื้นที่' : 'แบบระบุตำแหน่ง';

    const initialCoordsFormatted: google.maps.LatLngLiteral[] = rawApiCoordinates.map(coord => ({
        lat: coord[0],
        lng: coord[1]
    }));
    
    console.log("Initial Data (from card.data):", initialData);
    console.log("LocationCard Props Init after fix:", {
        cardId: card.id,
        rawApiCoordinates,
        detectedInitialLocationType,
        initialLat,
        initialLng,
        initialCoordsFormatted,
        isEditing,
    });


    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY || "",
        libraries: libraries,
        language: "th",
        region: "TH",
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const [autocompleteInputValue, setAutocompleteInputValue] = useState("");
    const [measurementSummaryText, setMeasurementSummaryText] = useState("");
    const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
        initialLat !== null && initialLng !== null ? { lat: initialLat, lng: initialLng } : null
    );
    const [currentCenter, setCurrentCenter] = useState(
        initialLat !== null && initialLng !== null ? { lat: initialLat, lng: initialLng } : defaultCenter
    );
    const [locationType, setLocationType] = useState<'แบบระบุตำแหน่ง' | 'แบบระบุพื้นที่'>(detectedInitialLocationType);
    const [manualLatInput, setManualLatInput] = useState<string>(
        initialLat !== null ? initialLat.toFixed(6) : ""
    );
    const [manualLngInput, setManualLngInput] = useState<string>(
        initialLng !== null ? initialLng.toFixed(6) : ""
    );

    const [activeDrawnShape, setActiveDrawnShape] = useState<google.maps.Polyline | google.maps.Polygon | null>(null);
    const [measuredValue, setMeasuredValue] = useState<number | null>(null);
    const [measuredUnit, setMeasuredUnit] = useState<string | null>(null);
    const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
    const [drawnCoordinates, setDrawnCoordinates] = useState<google.maps.LatLngLiteral[]>(initialCoordsFormatted);
    const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);

    const currentDrawingInstanceRef = useRef<google.maps.Polyline | google.maps.Polygon | null>(null);
    const hasInitialMapStateLoaded = useRef(false);
    const updateMeasuredValues = useCallback((shape: google.maps.Polyline | google.maps.Polygon | null, currentCoords: google.maps.LatLngLiteral[]) => {
        if (!shape && currentCoords.length === 0) {
            setMeasuredValue(null);
            setMeasuredUnit(null);
            setMeasurementSummaryText("");
            return;
        }

        const numPoints = currentCoords.length;
        let description = `พิกัด ${numPoints} จุด`;

        if (shape) {
            const path = shape.getPath();
            if (shape instanceof google.maps.Polyline) {
                const length = google.maps.geometry.spherical.computeLength(path);
                const unit = length > 1000 ? "กม." : "ม.";
                const formattedLength = unit === "กม." ? (length / 1000) : length;
                setMeasuredValue(formattedLength);
                setMeasuredUnit(unit);
                description = `รวมระยะทาง: ${formattedLength.toFixed(2)} ${unit} (${description})`;
            } else if (shape instanceof google.maps.Polygon) {
                const area = google.maps.geometry.spherical.computeArea(path);
                const perimeter = google.maps.geometry.spherical.computeLength(path);
                const areaUnit = area > 1000000 ? "ตร.กม." : "ตร.ม.";
                const perimeterUnit = perimeter > 1000 ? "กม." : "ม.";

                const formattedArea = areaUnit === "ตร.กม." ? (area / 1000000) : area;
                const formattedPerimeter = perimeterUnit === "กม." ? (perimeter / 1000) : perimeter;

                setMeasuredValue(formattedArea);
                setMeasuredUnit(areaUnit);
                description = `พื้นที่ทั้งหมด: ${formattedArea.toFixed(2)} ${areaUnit} (รวมระยะทาง: ${formattedPerimeter.toFixed(2)} ${perimeterUnit}) (${description})`;
            }
        } else if (numPoints > 0) {
            if (drawingMode === google.maps.drawing.OverlayType.POLYLINE) {
                if (numPoints >= 2) {
                    const tempPolyline = new google.maps.Polyline({ path: currentCoords });
                    const length = google.maps.geometry.spherical.computeLength(tempPolyline.getPath());
                    const unit = length > 1000 ? "กม." : "ม.";
                    const formattedLength = unit === "กม." ? (length / 1000) : length;
                    setMeasuredValue(formattedLength);
                    setMeasuredUnit(unit);
                    description = `รวมระยะทาง: ${formattedLength.toFixed(2)} ${unit} (${description})`;
                } else if (numPoints === 1) {
                    setMeasuredValue(0);
                    setMeasuredUnit("ม.");
                    description = `รวมระยะทาง: 0.00 ม. (${description} - คลิกอีกครั้งเพื่อคำนวณระยะทาง หรือ ดับเบิลคลิกเพื่อสิ้นสุด)`;
                }
            } else if (drawingMode === google.maps.drawing.OverlayType.POLYGON) {
                if (numPoints >= 3) {
                    const tempPolygon = new google.maps.Polygon({ paths: [currentCoords] });
                    const area = google.maps.geometry.spherical.computeArea(tempPolygon.getPath());
                    const perimeter = google.maps.geometry.spherical.computeLength(tempPolygon.getPath());
                    const areaUnit = area > 1000000 ? "ตร.กม." : "ตร.ม.";
                    const perimeterUnit = perimeter > 1000 ? "กม." : "ม.";

                    const formattedArea = areaUnit === "ตร.กม." ? (area / 1000000) : area;
                    const formattedPerimeter = perimeterUnit === "กม." ? (perimeter / 1000) : perimeter;

                    setMeasuredValue(formattedArea);
                    setMeasuredUnit(areaUnit);
                    description = `พื้นที่ทั้งหมด: ${formattedArea.toFixed(2)} ${areaUnit} (รวมระยะทาง: ${formattedPerimeter.toFixed(2)} ${perimeterUnit}) (${description})`;
                } else if (numPoints > 0) {
                    setMeasuredValue(null);
                    setMeasuredUnit(null);
                    description = `${description} (คลิกเพิ่มอีก ${3 - numPoints} จุด เพื่อคำนวณพื้นที่)`;
                }
            } else {
                setMeasuredValue(null);
                setMeasuredUnit(null);
                if (currentCoords.length >= 3) {
                    const tempPolygon = new google.maps.Polygon({ paths: [currentCoords] });
                    const area = google.maps.geometry.spherical.computeArea(tempPolygon.getPath());
                    const perimeter = google.maps.geometry.spherical.computeLength(tempPolygon.getPath());
                    const areaUnit = area > 1000000 ? "ตร.กม." : "ตร.ม.";
                    const perimeterUnit = perimeter > 1000 ? "กม." : "ม.";

                    const formattedArea = areaUnit === "ตร.กม." ? (area / 1000000) : area;
                    const formattedPerimeter = perimeterUnit === "กม." ? (perimeter / 1000) : perimeter;

                    setMeasuredValue(formattedArea);
                    setMeasuredUnit(areaUnit);
                    description = `พื้นที่ทั้งหมด: ${formattedArea.toFixed(2)} ${areaUnit} (รวมระยะทาง: ${formattedPerimeter.toFixed(2)} ${perimeterUnit}) (${description})`;
                } else if (currentCoords.length >= 2) {
                    const tempPolyline = new google.maps.Polyline({ path: currentCoords });
                    const length = google.maps.geometry.spherical.computeLength(tempPolyline.getPath());
                    const unit = length > 1000 ? "กม." : "ม.";
                    const formattedLength = unit === "กม." ? (length / 1000) : length;
                    setMeasuredValue(formattedLength);
                    setMeasuredUnit(unit);
                    description = `รวมระยะทาง: ${formattedLength.toFixed(2)} ${unit} (${description})`;
                } else {
                    setMeasuredValue(null);
                    setMeasuredUnit(null);
                    description = `พิกัด ${numPoints} จุด`;
                }
            }
        } else {
            setMeasuredValue(null);
            setMeasuredUnit(null);
        }
        setMeasurementSummaryText(description);
    }, [drawingMode]);

    useEffect(() => {
        let latToSend: number | null = null;
        let lngToSend: number | null = null;
        let locationTextToSend: string = "";
        let coordsToSend: [number, number][] = [];

        if (locationType === 'แบบระบุตำแหน่ง') {
            latToSend = markerPosition?.lat ?? null;
            lngToSend = markerPosition?.lng ?? null;
            locationTextToSend = autocompleteInputValue;
            if (markerPosition) {
                coordsToSend = [[markerPosition.lat, markerPosition.lng]];
            } else {
                coordsToSend = [];
            }
        } else {
            locationTextToSend = measurementSummaryText;
            coordsToSend = drawnCoordinates.map(coord => [coord.lat, coord.lng] as [number, number]);
        }
        
        onDataChange(card.id, {
            location: locationTextToSend,
            lat: latToSend,
            lng: lngToSend,
            locationType: locationType,
            coordinates: coordsToSend
        });

    }, [autocompleteInputValue, markerPosition, locationType, measurementSummaryText, drawnCoordinates, onDataChange, card.id]);


    const clearDrawnShape = useCallback(() => {
        if (activeDrawnShape && activeDrawnShape.getMap()) {
            activeDrawnShape.setMap(null);
            if (activeDrawnShape.getPath()) {
                google.maps.event.clearInstanceListeners(activeDrawnShape.getPath());
            }
        }
        setActiveDrawnShape(null);
        setMeasuredValue(null);
        setMeasuredUnit(null);
        setMeasurementSummaryText("");
        setDrawnCoordinates([]);
        currentDrawingInstanceRef.current = null;
        setDrawingMode(null);
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }
    }, [activeDrawnShape]);

    const handleClearLocation = useCallback(() => {
        setAutocompleteInputValue("");
        setMeasurementSummaryText("");
        setMarkerPosition(null);
        setCurrentCenter(defaultCenter);
        setManualLatInput("");
        setManualLngInput("");
        clearDrawnShape();
        setDrawingMode(null);
        setMapZoom(DEFAULT_ZOOM);
        hasInitialMapStateLoaded.current = false;
    }, [clearDrawnShape]);

    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;

        if (!drawingManagerRef.current) {
            const drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                polygonOptions: {
                    fillColor: '#AA0000',
                    strokeColor: '#FF0000',
                    fillOpacity: 0.35,
                    strokeWeight: 2,
                    clickable: true,
                    editable: isEditing,
                    zIndex: 1
                },
                polylineOptions: {
                    strokeColor: '#0000FF',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: true,
                    editable: isEditing,
                    zIndex: 1
                },
                map: mapRef.current
            });

            google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
                if (activeDrawnShape) {
                    activeDrawnShape.setMap(null);
                    if (activeDrawnShape.getPath()) {
                        google.maps.event.clearInstanceListeners(activeDrawnShape.getPath());
                    }
                }

                const shape = event.overlay as google.maps.Polyline | google.maps.Polygon;
                setActiveDrawnShape(shape);
                currentDrawingInstanceRef.current = shape;

                const newCoords = shape.getPath().getArray().map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));
                setDrawnCoordinates(newCoords);
                updateMeasuredValues(shape, newCoords);

                if (isEditing) {
                    google.maps.event.clearInstanceListeners(shape.getPath());
                    google.maps.event.addListener(shape.getPath(), 'set_at', () => {
                        const currentCoords = shape.getPath().getArray().map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));
                        setDrawnCoordinates(currentCoords);
                        updateMeasuredValues(shape, currentCoords);
                    });
                    google.maps.event.addListener(shape.getPath(), 'insert_at', () => {
                        const currentCoords = shape.getPath().getArray().map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));
                        setDrawnCoordinates(currentCoords);
                        updateMeasuredValues(shape, currentCoords);
                    });
                    google.maps.event.addListener(shape.getPath(), 'remove_at', () => {
                        const currentCoords = shape.getPath().getArray().map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));
                        setDrawnCoordinates(currentCoords);
                        updateMeasuredValues(shape, currentCoords);
                    });
                }
                drawingManagerRef.current?.setDrawingMode(null);
                setDrawingMode(null);
            });
            drawingManagerRef.current = drawingManager;
        } else {
            drawingManagerRef.current.setOptions({
                polygonOptions: { editable: isEditing },
                polylineOptions: { editable: isEditing },
            });
        }

        if (drawingManagerRef.current) {
            if (locationType === 'แบบระบุพื้นที่') {
                drawingManagerRef.current.setMap(mapRef.current);
                if (drawingMode && isEditing) {
                    drawingManagerRef.current.setDrawingMode(drawingMode);
                } else {
                    drawingManagerRef.current.setDrawingMode(null);
                }
            } else {
                drawingManagerRef.current.setMap(null);
                drawingManagerRef.current.setDrawingMode(null);
                setDrawingMode(null);
            }
        }
    }, [isLoaded, mapRef, locationType, activeDrawnShape, updateMeasuredValues, drawingMode, isEditing]);

    useEffect(() => {
        if (!isLoaded || !mapRef.current || hasInitialMapStateLoaded.current) return;
        if (locationType === 'แบบระบุตำแหน่ง' && initialLat !== null && initialLng !== null) {
            const initialMapCenter = { lat: initialLat, lng: initialLng };
            setMarkerPosition(initialMapCenter);
            setCurrentCenter(initialMapCenter);
            setManualLatInput(initialLat.toFixed(6));
            setManualLngInput(initialLng.toFixed(6));
            setMapZoom(SEARCH_ZOOM);

            if (!autocompleteInputValue) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: initialMapCenter }, (results, status) => {
                    if (status === "OK" && results && results[0]) {
                        setAutocompleteInputValue(results[0].formatted_address);
                    } else {
                        console.error("Reverse geocoding failed on initial load:", status);
                        setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
                    }
                });
            }
            hasInitialMapStateLoaded.current = true;
            return;
        }

        if (!hasInitialMapStateLoaded.current) {
            setCurrentCenter(defaultCenter);
            setMapZoom(DEFAULT_ZOOM);
            hasInitialMapStateLoaded.current = true;
        }


    }, [isLoaded, mapRef, locationType, drawnCoordinates, initialLat, initialLng, isEditing, updateMeasuredValues, autocompleteInputValue]);

    

    useEffect(() => {
        if (isEditing && locationType === 'แบบระบุตำแหน่ง' && markerPosition) {
            setCurrentCenter(markerPosition);
            setMapZoom(SEARCH_ZOOM);
            if (isLoaded) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: markerPosition }, (results, status) => {
                    if (status === "OK" && results && results[0]) {
                        setAutocompleteInputValue(results[0].formatted_address);
                    } else {
                        setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
                        console.error("Reverse geocoding failed on edit load: " + status);
                    }
                });
            } else {
                setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
            }
        }
    }, [isEditing, locationType, markerPosition, isLoaded]);

    useEffect(() => {
        if (!isEditing && locationType === 'แบบระบุตำแหน่ง' && markerPosition && autocompleteInputValue === "" && isLoaded) {
            setCurrentCenter(markerPosition);
            setMapZoom(SEARCH_ZOOM);
    
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: markerPosition }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                    setAutocompleteInputValue(results[0].formatted_address);
                } else {
                    console.error("Reverse geocoding failed on initial load: " + status);
                    setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
                }
            });
        }
    }, [isEditing, locationType, markerPosition, autocompleteInputValue, isLoaded, setAutocompleteInputValue, setCurrentCenter, setMapZoom]);

    

    const onPlaceChanged = useCallback(() => {
        if (!isEditing) return;
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const newCenter = { lat, lng };

                setAutocompleteInputValue(place.name || place.formatted_address || "");

                if (locationType === 'แบบระบุตำแหน่ง') {
                    setMarkerPosition(newCenter);
                    setManualLatInput(lat.toFixed(6));
                    setManualLngInput(lng.toFixed(6));
                    clearDrawnShape();
                } else {
                    setMarkerPosition(newCenter);
                }
                setCurrentCenter(newCenter);
                setMapZoom(SEARCH_ZOOM);
            } else {
                setMarkerPosition(null);
                setCurrentCenter(defaultCenter);
                setAutocompleteInputValue("");
                setMeasurementSummaryText("");
                setManualLatInput("");
                setManualLngInput("");
                setMapZoom(DEFAULT_ZOOM);
                clearDrawnShape();
            }
        }
    }, [locationType, clearDrawnShape, isEditing]);

    const handleLocationTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!isEditing) return;
        const value = e.target.value;
        const newType = value as 'แบบระบุตำแหน่ง' | 'แบบระบุพื้นที่';

        setLocationType(newType);
        setAutocompleteInputValue("");
        setMeasurementSummaryText("");
        setMarkerPosition(null);
        setCurrentCenter(defaultCenter);
        setManualLatInput("");
        setManualLngInput("");
        clearDrawnShape();
        setMapZoom(DEFAULT_ZOOM);
        hasInitialMapStateLoaded.current = false;
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }

        if (newType === 'แบบระบุพื้นที่') {
            updateMeasuredValues(null, []);
        }
    }, [clearDrawnShape, isEditing, updateMeasuredValues]);

    const handleManualLatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditing) return;
        const value = e.target.value;
        setManualLatInput(value);

        const parsedLat = parseFloat(value);
        if (!isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90) {
            const newEffectiveLng = markerPosition?.lng !== undefined && markerPosition.lng !== null
                                    ? markerPosition.lng
                                    : (manualLngInput !== "" ? parseFloat(manualLngInput) : defaultCenter.lng);
            const newLatPosition = { lat: parsedLat, lng: newEffectiveLng };

            setMarkerPosition(newLatPosition);
            setCurrentCenter(newLatPosition);
            setMapZoom(SEARCH_ZOOM);

            if (isLoaded) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: newLatPosition }, (results, status) => {
                    if (status === "OK" && results && results[0]) {
                        setAutocompleteInputValue(results[0].formatted_address);
                    } else {
                        setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
                        console.error("Reverse geocoding failed for manual lat change due to: " + status);
                    }
                });
            } else {
                setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
            }
            clearDrawnShape();
        } else if (value === "") {
            setMarkerPosition(null);
            setAutocompleteInputValue("");
            setMapZoom(DEFAULT_ZOOM);
            clearDrawnShape();
        }
    }, [isLoaded, markerPosition?.lng, manualLngInput, clearDrawnShape, isEditing]);

    const handleManualLngChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditing) return;
        const value = e.target.value;
        setManualLngInput(value);

        const parsedLng = parseFloat(value);
        if (!isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180) {
            const newEffectiveLat = markerPosition?.lat !== undefined && markerPosition.lat !== null
                                    ? markerPosition.lat
                                    : (manualLatInput !== "" ? parseFloat(manualLatInput) : defaultCenter.lat);
            const newLngPosition = { lat: newEffectiveLat, lng: parsedLng };

            setMarkerPosition(newLngPosition);
            setCurrentCenter(newLngPosition);
            setMapZoom(SEARCH_ZOOM);

            if (isLoaded) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: newLngPosition }, (results, status) => {
                    if (status === "OK" && results && results[0]) {
                        setAutocompleteInputValue(results[0].formatted_address);
                    } else {
                        setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
                        console.error("Reverse geocoding failed for manual lng change due to: " + status);
                    }
                });
            } else {
                setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด");
            }
            clearDrawnShape();
        } else if (value === "") {
            setMarkerPosition(null);
            setAutocompleteInputValue("");
            setMapZoom(DEFAULT_ZOOM);
            clearDrawnShape();
        }
    }, [isLoaded, markerPosition?.lat, manualLatInput, clearDrawnShape, isEditing]);


    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (!isEditing) return;
        if (!e.latLng) return;

        if (locationType === 'แบบระบุตำแหน่ง') {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            const newPosition = { lat, lng };

            setMarkerPosition(newPosition);
            setCurrentCenter(newPosition);
            setManualLatInput(lat.toFixed(6));
            setManualLngInput(lng.toFixed(6));
            setMapZoom(SEARCH_ZOOM);
            clearDrawnShape();

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: e.latLng }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                    const placeName = results[0].formatted_address;
                    setAutocompleteInputValue(placeName);
                } else {
                    console.error("Geocoder failed due to: " + status);
                    setAutocompleteInputValue("ไม่พบชื่อสถานที่สำหรับพิกัดนี้");
                }
            });
        } else if (locationType === 'แบบระบุพื้นที่' && drawingMode !== null) {
            setDrawnCoordinates(prevCoords => {
                const newCoords = [...prevCoords, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }];
                updateMeasuredValues(null, newCoords);
                return newCoords;
            });
        }
    }, [locationType, drawingMode, updateMeasuredValues, clearDrawnShape, isEditing]);

    const onMapDblClick = useCallback(() => {
        if (!isEditing) return;
        if (locationType === 'แบบระบุพื้นที่' && drawingMode !== null) {
            if (drawingManagerRef.current) {
                drawingManagerRef.current.setDrawingMode(null);
            }
            setDrawingMode(null);
        }
    }, [isEditing, locationType, drawingMode]);


    const renderMap = () => {
        const mapContainerStyle = {
            width: '100%',
            height: '250px',
            borderRadius: '0.375rem',
        };

        if (loadError) return <div className="w-full h-[250px] bg-red-100 rounded-md mt-2 text-center text-sm text-red-700 flex items-center justify-center border border-red-300">เกิดข้อผิดพลาดในการโหลดแผนที่</div>;
        if (!isLoaded) return <div className="w-full h-[250px] bg-gray-100 rounded-md mt-2 text-center text-sm text-gray-400 flex items-center justify-content border border-gray-300">กำลังโหลด Google Maps...</div>;

        return (
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={currentCenter}
                zoom={mapZoom}
                onLoad={(map: google.maps.Map) => {
                    mapRef.current = map;
                    
                    if (locationType === 'แบบระบุพื้นที่' && drawnCoordinates.length > 0) {
                        let shapeToLoad: google.maps.Polyline | google.maps.Polygon | null = null;
                        if (drawnCoordinates.length >= 3) {
                            shapeToLoad = new google.maps.Polygon({
                                paths: [drawnCoordinates],
                                fillColor: '#AA0000',
                                strokeColor: '#FF0000',
                                fillOpacity: 0.35,
                                strokeWeight: 2,
                                clickable: true,
                                editable: isEditing,
                                zIndex: 1,
                                map: mapRef.current
                            });
                        } else if (drawnCoordinates.length >= 2) {
                            shapeToLoad = new google.maps.Polyline({
                                path: drawnCoordinates,
                                strokeColor: '#0000FF',
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                clickable: true,
                                editable: isEditing,
                                zIndex: 1,
                                map: mapRef.current
                            });
                        }
            
                        if (shapeToLoad) {
                            setActiveDrawnShape(shapeToLoad);
                            currentDrawingInstanceRef.current = shapeToLoad;
                            updateMeasuredValues(shapeToLoad, drawnCoordinates);
            
                            const bounds = new google.maps.LatLngBounds();
                            if (shapeToLoad instanceof google.maps.Polygon) {
                                shapeToLoad.getPaths().forEach(path => {
                                    path.forEach(latLng => bounds.extend(latLng));
                                });
                            } else if (shapeToLoad instanceof google.maps.Polyline) {
                                shapeToLoad.getPath().forEach(latLng => bounds.extend(latLng));
                            }
                            if (!bounds.isEmpty()) {
                                mapRef.current.fitBounds(bounds);
                            }
                        }
                    }
                }}
                onClick={onMapClick}
                onDblClick={onMapDblClick}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    scaleControl: true,
                    streetViewControl: false,
                    rotateControl: false,
                    fullscreenControl: false,
                    draggable: isEditing,
                    zoomControlOptions: {
                        position: google.maps.ControlPosition.RIGHT_BOTTOM,
                    }
                }}
            >
                {markerPosition && locationType === 'แบบระบุตำแหน่ง' && (
                    <MarkerF
                        position={markerPosition}
                        draggable={isEditing}
                        onDragEnd={(e) => {
                            if (!isEditing) return;
                            const newLat = e.latLng?.lat();
                            const newLng = e.latLng?.lng();
                            if (newLat !== undefined && newLng !== undefined) {
                                setMarkerPosition({ lat: newLat, lng: newLng });
                                setManualLatInput(newLat.toFixed(6));
                                setManualLngInput(newLng.toFixed(6));
                                const geocoder = new google.maps.Geocoder();
                                geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                                    if (status === "OK" && results && results[0]) {
                                        setAutocompleteInputValue(results[0].formatted_address);
                                    } else {
                                        setAutocompleteInputValue("ตำแหน่งที่ระบุด้วยพิกัด (ลาก)");
                                    }
                                });
                            }
                        }}
                    />
                )}
                {markerPosition && locationType === 'แบบระบุพื้นที่' && autocompleteInputValue && !activeDrawnShape && drawnCoordinates.length === 0 && (
                    <MarkerF
                        position={markerPosition}
                        draggable={false}
                    />
                )}
        
                {locationType === 'แบบระบุพื้นที่' && drawnCoordinates.length > 0 && (
                    <>
                        {drawingMode === google.maps.drawing.OverlayType.POLYLINE && activeDrawnShape === null && (
                            <PolylineF
                                path={drawnCoordinates}
                                options={{
                                    strokeColor: '#0000FF',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    clickable: false,
                                    editable: isEditing,
                                    zIndex: 1,
                                }}
                            />
                        )}
                        {drawingMode === google.maps.drawing.OverlayType.POLYGON && activeDrawnShape === null && (
                            <PolygonF
                                paths={[drawnCoordinates]}
                                options={{
                                    fillColor: '#AA0000',
                                    strokeColor: '#FF0000',
                                    fillOpacity: 0.35,
                                    strokeWeight: 2,
                                    clickable: false,
                                    editable: isEditing,
                                    zIndex: 1
                                }}
                            />
                        )}
        
                        {activeDrawnShape && activeDrawnShape instanceof google.maps.Polyline && (
                            <PolylineF
                                path={drawnCoordinates}
                                options={{
                                    strokeColor: '#0000FF',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    clickable: true,
                                    editable: isEditing,
                                    zIndex: 1
                                }}
                            />
                        )}
                        {activeDrawnShape && activeDrawnShape instanceof google.maps.Polygon && (
                            <PolygonF
                                paths={[drawnCoordinates]}
                                options={{
                                    fillColor: '#AA0000',
                                    strokeColor: '#FF0000',
                                    fillOpacity: 0.35,
                                    strokeWeight: 2,
                                    clickable: true,
                                    editable: isEditing,
                                    zIndex: 1
                                }}
                            />
                        )}
                    </>
                )}
            </GoogleMap>
        );
    };

    const handleDrawnCoordinateChange = useCallback((
        index: number,
        field: 'lat' | 'lng',
        value: string
    ) => {
        if (!isEditing) return;
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
            return;
        }

        setDrawnCoordinates(prevCoords => {
            const newCoordinates = [...prevCoords];
            if (index < 0 || index >= newCoordinates.length) {
                console.warn("Invalid coordinate index for update.");
                return prevCoords;
            }

            if (field === 'lat') {
                newCoordinates[index] = { ...newCoordinates[index], lat: parsedValue };
            } else {
                newCoordinates[index] = { ...newCoordinates[index], lng: parsedValue };
            }
            if (activeDrawnShape) { 
                const path = activeDrawnShape.getPath();
                if (path && path.setAt) {
                    path.setAt(index, new google.maps.LatLng(newCoordinates[index].lat, newCoordinates[index].lng));
                    updateMeasuredValues(activeDrawnShape, newCoordinates);
                }
            } else {
                 updateMeasuredValues(null, newCoordinates);
            }
            return newCoordinates;
        });
    }, [updateMeasuredValues, isEditing, activeDrawnShape]);


    const handleDrawingToolClick = useCallback((type: google.maps.drawing.OverlayType) => {
        if (!isEditing) return;
        clearDrawnShape();
        setDrawingMode(type);

        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(type);
        }
    }, [clearDrawnShape, isEditing]);

    const handleStopDrawingClick = useCallback(() => {
        if (!isEditing) return;
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }
        setDrawingMode(null);
        clearDrawnShape();
    }, [clearDrawnShape, isEditing]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800 font-semibold text-sm">ตำแหน่ง</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="locationType" className="block text-gray-700 font-medium mb-1 text-sm">
                        ประเภทตำแหน่ง
                    </label>
                    <select
                        id="locationType"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={locationType}
                        onChange={handleLocationTypeChange}
                        disabled={!isEditing}
                    >
                        <option value="แบบระบุตำแหน่ง">แบบระบุตำแหน่ง</option>
                        <option value="แบบระบุพื้นที่">แบบระบุพื้นที่</option>
                    </select>
                </div>

                {(locationType === 'แบบระบุตำแหน่ง' || locationType === 'แบบระบุพื้นที่') && (
                    <div className="flex-1">
                        <label htmlFor="foundLocation" className="block text-gray-700 font-medium mb-1 text-sm">
                            ที่อยู่ (ค้นหาด้วยชื่อหรือที่อยู่)
                        </label>
                        <div className="relative">
                            {isLoaded ? (
                                <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={onPlaceChanged}>
                                    <input
                                        type="text"
                                        id="foundLocation"
                                        className="w-full p-2 border border-[#0059C8] bg-[#F3F9FF] rounded-[23px] focus:ring-[#0059C8] focus:border-[#0059C8] pr-10 text-sm"
                                        placeholder="ค้นหาที่อยู่หรือชื่ออาคาร"
                                        value={autocompleteInputValue}
                                        onChange={(e) => setAutocompleteInputValue(e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </Autocomplete>
                            ) : (
                                <input
                                    type="text"
                                    disabled
                                    className="w-full p-2 border border-[#0059C8] bg-[#F3F9FF] rounded-[23px] focus:ring-[#0059C8] focus:border-[#0059C8] pr-10 text-sm opacity-50"
                                    placeholder="กำลังโหลด Google Maps..."
                                />
                            )}
                            {(autocompleteInputValue || (markerPosition && locationType === 'แบบระบุตำแหน่ง')) && (
                                <button
                                    type="button"
                                    onClick={handleClearLocation}
                                    className={`absolute inset-y-0 right-7 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-label="Clear search"
                                    disabled={!isEditing}
                                >
                                    <FaTimes className="h-3 w-3" />
                                </button>
                            )}
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <FaSearch className="h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {locationType === 'แบบระบุตำแหน่ง' && (
                <div className="flex flex-col pt-4 pb-4 text-gray-700 text-sm">
                    <p className="text-gray-700 font-medium mb-2 text-sm">สถานที่พบ:</p>
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
                        <span className="font-semibold">ตำแหน่ง</span>
                        <div className="flex items-center gap-1">
                            <span className="font-semibold">ละติจูด:</span>
                            <input
                                type="number"
                                id="manualLat"
                                className="w-24 p-1 border border-blue-200 bg-blue-100 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-blue-800"
                                placeholder=""
                                value={manualLatInput}
                                onChange={handleManualLatChange}
                                step="any"
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-semibold">ลองจิจูด:</span>
                            <input
                                type="number"
                                id="manualLng"
                                className="w-24 p-1 border border-blue-200 bg-blue-100 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-blue-800"
                                placeholder=""
                                value={manualLngInput}
                                onChange={handleManualLngChange}
                                step="any"
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </div>
            )}

            {(locationType === 'แบบระบุตำแหน่ง' || locationType === 'แบบระบุพื้นที่') && (
                <div className="mb-4">
                    {renderMap()}
                </div>
            )}

            {locationType === 'แบบระบุพื้นที่' && isLoaded && (
                <div className="flex gap-2 justify-center mb-4 mt-2">
                    <button
                        onClick={() => handleDrawingToolClick(google.maps.drawing.OverlayType.POLYLINE)}
                        className={`p-2 rounded-md flex items-center gap-1 text-sm ${
                            drawingMode === google.maps.drawing.OverlayType.POLYLINE && isEditing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        } hover:bg-blue-600 hover:text-white transition-colors ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isEditing}
                    >
                        <FaRulerHorizontal className="w-3 h-3" />
                        <span>วาดเส้น (ระยะทาง)</span>
                    </button>
                    <button
                        onClick={() => handleDrawingToolClick(google.maps.drawing.OverlayType.POLYGON)}
                        className={`p-2 rounded-md flex items-center gap-1 text-sm ${
                            drawingMode === google.maps.drawing.OverlayType.POLYGON && isEditing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        } hover:bg-blue-600 hover:text-white transition-colors ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isEditing}
                    >
                        <FaDrawPolygon className="w-3 h-3" />
                        <span>วาดพื้นที่</span>
                    </button>

                    {(drawingMode !== null || activeDrawnShape !== null || drawnCoordinates.length > 0) && (
                        <button
                            onClick={handleStopDrawingClick}
                            className={`p-2 rounded-md flex items-center gap-1 text-sm bg-red-200 text-red-700 hover:bg-red-300 transition-colors ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!isEditing}
                        >
                            {drawingMode !== null ? (
                                <>
                                    <FaTimes className="w-3 h-3" />
                                    <span>หยุดวาด</span>
                                </>
                            ) : (
                                <>
                                    <FaTrashAlt className="w-3 h-3" />
                                    <span>ล้าง</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {locationType === 'แบบระบุพื้นที่' && (
                <div className="mb-4 pt-4 text-gray-700 text-sm">
                    <p className="text-gray-700 font-medium mb-2 text-sm">สถานที่พบ:</p>
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
                        {measurementSummaryText ? (
                            <p className="font-semibold mb-2">{measurementSummaryText}</p>
                        ) : (
                            <p className="text-gray-600 mb-2">กรุณาเลือกเครื่องมือวาด (วาดเส้น/วาดพื้นที่) และคลิกบนแผนที่เพื่อระบุ</p>
                        )}

                        {drawnCoordinates.length > 0 && (
                            <div className="mb-2">
                                {drawnCoordinates.map((coord, index) => (
                                    <div key={index} className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                                        <span className="font-semibold">จุดที่ {index + 1}:</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">ละติจูด:</span>
                                            <input
                                                type="number"
                                                className="w-30 p-1 border border-blue-200 bg-blue-100 rounded-md text-sm text-blue-800"
                                                value={coord.lat.toFixed(6)}
                                                onChange={(e) => handleDrawnCoordinateChange(index, 'lat', e.target.value)}
                                                step="any"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">ลองจิจูด:</span>
                                            <input
                                                type="number"
                                                className="w-30 p-1 border border-blue-200 bg-blue-100 rounded-md text-sm text-blue-800"
                                                value={coord.lng.toFixed(6)}
                                                onChange={(e) => handleDrawnCoordinateChange(index, 'lng', e.target.value)}
                                                step="any"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationCard;