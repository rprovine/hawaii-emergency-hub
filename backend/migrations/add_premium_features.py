#!/usr/bin/env python3
"""
Add premium features and subscription tables to database
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create enums
    op.execute("CREATE TYPE subscriptiontier AS ENUM ('free', 'essential', 'premium', 'business', 'enterprise')")
    op.execute("CREATE TYPE paymentstatus AS ENUM ('pending', 'active', 'past_due', 'cancelled', 'expired')")
    
    # Add columns to users table
    op.add_column('users', sa.Column('subscription_tier', sa.Enum('free', 'essential', 'premium', 'business', 'enterprise', name='subscriptiontier'), nullable=True))
    op.add_column('users', sa.Column('subscription_expires', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('saved_locations', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('family_members', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('api_key', sa.String(), nullable=True))
    op.add_column('users', sa.Column('api_calls_today', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('api_calls_reset', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('organization_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('team_members', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('is_team_owner', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('custom_branding', sa.JSON(), nullable=True))
    
    # Create unique indices
    op.create_unique_constraint(None, 'users', ['stripe_customer_id'])
    op.create_unique_constraint(None, 'users', ['api_key'])
    
    # Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('tier', sa.Enum('free', 'essential', 'premium', 'business', 'enterprise', name='subscriptiontier'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'active', 'past_due', 'cancelled', 'expired', name='paymentstatus'), nullable=False),
        sa.Column('monthly_price', sa.Float(), nullable=True),
        sa.Column('annual_price', sa.Float(), nullable=True),
        sa.Column('is_annual', sa.Boolean(), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(), nullable=True),
        sa.Column('stripe_price_id', sa.String(), nullable=True),
        sa.Column('stripe_payment_method', sa.String(), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=True),
        sa.Column('max_saved_locations', sa.Integer(), nullable=True),
        sa.Column('max_family_members', sa.Integer(), nullable=True),
        sa.Column('max_api_calls_per_day', sa.Integer(), nullable=True),
        sa.Column('max_team_members', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_unique_constraint(None, 'subscriptions', ['user_id'])
    op.create_unique_constraint(None, 'subscriptions', ['stripe_subscription_id'])
    
    # Create payments table
    op.create_table('payments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('subscription_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('stripe_payment_intent_id', sa.String(), nullable=True),
        sa.Column('stripe_invoice_id', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('failure_reason', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_unique_constraint(None, 'payments', ['stripe_payment_intent_id'])
    
    # Create alert_zones table
    op.create_table('alert_zones',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('center_latitude', sa.Float(), nullable=True),
        sa.Column('center_longitude', sa.Float(), nullable=True),
        sa.Column('radius_miles', sa.Float(), nullable=True),
        sa.Column('polygon', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('severity_threshold', sa.Enum('minor', 'moderate', 'severe', 'extreme', name='alertseverity'), nullable=True),
        sa.Column('categories', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create notification_channels table
    op.create_table('notification_channels',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('channel_type', sa.String(), nullable=True),
        sa.Column('destination', sa.String(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('severity_threshold', sa.Enum('minor', 'moderate', 'severe', 'extreme', name='alertseverity'), nullable=True),
        sa.Column('categories', sa.JSON(), nullable=True),
        sa.Column('verification_code', sa.String(), nullable=True),
        sa.Column('verification_sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_used', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create api_usage table
    op.create_table('api_usage',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('endpoint', sa.String(), nullable=True),
        sa.Column('method', sa.String(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('api_key_used', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('requested_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Set default values for existing users
    op.execute("UPDATE users SET subscription_tier = 'free' WHERE subscription_tier IS NULL")
    op.execute("UPDATE users SET api_calls_today = 0 WHERE api_calls_today IS NULL")
    op.execute("UPDATE users SET is_team_owner = false WHERE is_team_owner IS NULL")

def downgrade():
    # Drop tables
    op.drop_table('api_usage')
    op.drop_table('notification_channels')
    op.drop_table('alert_zones')
    op.drop_table('payments')
    op.drop_table('subscriptions')
    
    # Remove columns from users table
    op.drop_column('users', 'custom_branding')
    op.drop_column('users', 'is_team_owner')
    op.drop_column('users', 'team_members')
    op.drop_column('users', 'organization_name')
    op.drop_column('users', 'api_calls_reset')
    op.drop_column('users', 'api_calls_today')
    op.drop_column('users', 'api_key')
    op.drop_column('users', 'family_members')
    op.drop_column('users', 'saved_locations')
    op.drop_column('users', 'stripe_customer_id')
    op.drop_column('users', 'subscription_expires')
    op.drop_column('users', 'subscription_tier')
    
    # Drop enums
    op.execute("DROP TYPE subscriptiontier")
    op.execute("DROP TYPE paymentstatus")