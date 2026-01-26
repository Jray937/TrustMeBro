use crate::market::HistoricalData;
use plotters::prelude::*;
use std::error::Error;

pub fn generate_chart(
    ticker: &str,
    data: &[HistoricalData],
) -> Result<String, Box<dyn Error + Send + Sync>> {
    let file_path = format!("/tmp/{}_chart.png", ticker);

    // Determine bounds
    let max_price = data.iter().map(|d| d.high).fold(0. / 0., f64::max);
    let min_price = data.iter().map(|d| d.low).fold(1. / 0., f64::min);

    {
        let root = BitMapBackend::new(&file_path, (800, 480)).into_drawing_area();
        root.fill(&WHITE)?;

        let mut chart = ChartBuilder::on(&root)
            .caption(
                format!("{} Price History", ticker.to_uppercase()),
                ("sans-serif", 30),
            )
            .margin(10)
            .x_label_area_size(40)
            .y_label_area_size(50)
            .build_cartesian_2d(0..data.len(), min_price..max_price)?;

        chart.configure_mesh().draw()?;

        chart.draw_series(LineSeries::new(
            data.iter().enumerate().map(|(i, d)| (i, d.close)),
            &BLUE,
        ))?;
    }

    Ok(file_path)
}
