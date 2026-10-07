"""
Initial migration for NIRIKSHAN Dynamic ESS Intelligence tables
Revision ID: 001_initial_tables
Revises:
Create Date: 2026-10-08 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Lots Table
    op.create_table(
        'lots',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('device_family', sa.String(length=128), nullable=False),
        sa.Column('wafer_lot_id', sa.String(length=64), nullable=True),
        sa.Column('qualification_level', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=64), nullable=False),
        sa.Column('chamber_id', sa.String(length=64), nullable=False),
        sa.Column('total_components', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('accepted_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('review_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rejected_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('median_leakage', sa.Float(), nullable=True),
        sa.Column('mad_leakage', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Create Components Table
    op.create_table(
        'components',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('lot_id', sa.String(length=64), nullable=False),
        sa.Column('wafer_x', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('wafer_y', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_wafer_edge', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('modified_z_score', sa.Float(), nullable=True),
        sa.Column('mahalanobis_distance', sa.Float(), nullable=True),
        sa.Column('predicted_168h_leakage', sa.Float(), nullable=True),
        sa.Column('p10_lower_bound', sa.Float(), nullable=True),
        sa.Column('p90_upper_bound', sa.Float(), nullable=True),
        sa.Column('drift_rate_ua_h', sa.Float(), nullable=True),
        sa.Column('curvature_96h', sa.Float(), nullable=True),
        sa.Column('defect_type', sa.String(length=64), nullable=False),
        sa.Column('verdict', sa.String(length=32), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('failure_mode_driver', sa.Text(), nullable=True),
        sa.Column('disposition_notes', sa.Text(), nullable=True),
        sa.Column('inspector_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['lot_id'], ['lots.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_components_lot_id'), 'components', ['lot_id'], unique=False)

    # 3. Create Measurements Table (TimescaleDB Hypertable)
    op.create_table(
        'measurements',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('component_id', sa.String(length=64), nullable=False),
        sa.Column('hour_milestone', sa.Integer(), nullable=False),
        sa.Column('iddq_leakage_ua', sa.Float(), nullable=False),
        sa.Column('propagation_delay_ns', sa.Float(), nullable=False),
        sa.Column('standby_current_ua', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('contact_resistance_ohm', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('chamber_temperature_c', sa.Float(), nullable=False, server_default='125.0'),
        sa.Column('vdd_bias_volts', sa.Float(), nullable=False, server_default='3.30'),
        sa.Column('is_valid_contact', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_quarantined', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_measurements_component_id'), 'measurements', ['component_id'], unique=False)
    op.create_index(op.f('ix_measurements_timestamp'), 'measurements', ['timestamp'], unique=False)

    # 4. Create Historical Baselines Table
    op.create_table(
        'historical_baselines',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('device_family', sa.String(length=128), nullable=False),
        sa.Column('median_leakage_ua', sa.Float(), nullable=False, server_default='11.4'),
        sa.Column('mad_leakage_ua', sa.Float(), nullable=False, server_default='1.15'),
        sa.Column('mean_delay_ns', sa.Float(), nullable=False, server_default='1.80'),
        sa.Column('std_delay_ns', sa.Float(), nullable=False, server_default='0.25'),
        sa.Column('covariance_matrix_json', sa.Text(), nullable=False),
        sa.Column('sample_size_n', sa.Integer(), nullable=False, server_default='500'),
        sa.Column('qualification_authority', sa.String(length=64), nullable=False, server_default='ISRO-VSSC-QA'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_family')
    )

    # 5. Create NCR Reports Table
    op.create_table(
        'ncr_reports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_uuid', sa.String(length=64), nullable=False),
        sa.Column('component_id', sa.String(length=64), nullable=False),
        sa.Column('lot_id', sa.String(length=64), nullable=False),
        sa.Column('inspector_id', sa.String(length=64), nullable=False),
        sa.Column('disposition_verdict', sa.String(length=32), nullable=False),
        sa.Column('failure_signature', sa.String(length=128), nullable=False),
        sa.Column('modified_z_score', sa.Float(), nullable=False),
        sa.Column('mahalanobis_distance', sa.Float(), nullable=False),
        sa.Column('predicted_168h_leakage', sa.Float(), nullable=False),
        sa.Column('safety_slope_ratio', sa.Float(), nullable=False),
        sa.Column('sha256_hash', sa.String(length=64), nullable=False),
        sa.Column('pdf_blob', sa.LargeBinary(), nullable=True),
        sa.Column('report_metadata_json', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('report_uuid')
    )
    op.create_index(op.f('ix_ncr_reports_component_id'), 'ncr_reports', ['component_id'], unique=False)
    op.create_index(op.f('ix_ncr_reports_lot_id'), 'ncr_reports', ['lot_id'], unique=False)


def downgrade() -> None:
    op.drop_table('ncr_reports')
    op.drop_table('historical_baselines')
    op.drop_table('measurements')
    op.drop_table('components')
    op.drop_table('lots')
