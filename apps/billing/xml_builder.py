"""XML builder for FEL Guatemala invoices."""
from xml.etree.ElementTree import Element, SubElement, tostring

from django.utils import timezone


def build_invoice_xml(invoice) -> str:
    """
    Build the FEL-compatible XML for an invoice.
    Based on SAT Guatemala FEL schema.
    """
    root = Element("GTDocumento")
    root.set("xmlns", "http://www.sat.gob.gt/dte/fel/ComprobantesElectronicos/0.2.0")
    root.set("Version", "0.1")

    # SAT section
    sat = SubElement(root, "SAT", ClaseDocumento="dte")
    dte = SubElement(sat, "DTE", ID="DatosCertificados")
    datos_emision = SubElement(dte, "DatosEmision", ID="DatosEmision")

    # General data
    datos_generales = SubElement(datos_emision, "DatosGenerales")
    datos_generales.set("CodigoMoneda", "GTQ")
    datos_generales.set("FechaHoraEmision", timezone.now().strftime("%Y-%m-%dT%H:%M:%S-06:00"))
    datos_generales.set("Tipo", invoice.document_type)

    # Emitter (company) — placeholder for configuration
    emisor = SubElement(datos_emision, "Emisor")
    emisor.set("AfiliacionIVA", "GEN")
    emisor.set("CodigoEstablecimiento", "1")
    emisor.set("CorreoEmisor", "")
    emisor.set("NITEmisor", "CONFIGURAR")
    emisor.set("NombreComercial", "SistemaOVO")
    emisor.set("NombreEmisor", "CONFIGURAR")

    direccion_emisor = SubElement(emisor, "DireccionEmisor")
    SubElement(direccion_emisor, "Direccion").text = "CONFIGURAR"
    SubElement(direccion_emisor, "CodigoPostal").text = "01001"
    SubElement(direccion_emisor, "Municipio").text = "GUATEMALA"
    SubElement(direccion_emisor, "Departamento").text = "GUATEMALA"
    SubElement(direccion_emisor, "Pais").text = "GT"

    # Receiver (client)
    receptor = SubElement(datos_emision, "Receptor")
    receptor.set("CorreoReceptor", invoice.client.email or "")
    receptor.set("IDReceptor", invoice.client.nit)
    receptor.set("NombreReceptor", invoice.client.name)

    direccion_receptor = SubElement(receptor, "DireccionReceptor")
    SubElement(direccion_receptor, "Direccion").text = invoice.client.address or "Ciudad"
    SubElement(direccion_receptor, "CodigoPostal").text = "01001"
    SubElement(direccion_receptor, "Municipio").text = "GUATEMALA"
    SubElement(direccion_receptor, "Departamento").text = "GUATEMALA"
    SubElement(direccion_receptor, "Pais").text = "GT"

    # Items
    items_el = SubElement(datos_emision, "Items")
    for idx, item in enumerate(invoice.items.select_related("product").all(), 1):
        item_el = SubElement(items_el, "Item", NumeroLinea=str(idx), BienOServicio="B")
        SubElement(item_el, "Cantidad").text = str(item.display_qty)
        SubElement(item_el, "UnidadMedida").text = item.display_unit
        SubElement(item_el, "Descripcion").text = item.description
        SubElement(item_el, "PrecioUnitario").text = str(item.unit_price)
        SubElement(item_el, "Precio").text = str(item.subtotal + item.discount)
        SubElement(item_el, "Descuento").text = str(item.discount)
        SubElement(item_el, "Total").text = str(item.subtotal)

    # Totals
    totales = SubElement(datos_emision, "Totales")
    gran_total = SubElement(totales, "GranTotal")
    gran_total.text = str(invoice.total)

    return tostring(root, encoding="unicode", xml_declaration=True)
