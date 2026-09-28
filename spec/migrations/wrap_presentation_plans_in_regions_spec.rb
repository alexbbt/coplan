require "rails_helper"
require CoPlan::Engine.root.join("db/migrate/20260925000000_wrap_presentation_plans_in_regions.rb")

RSpec.describe WrapPresentationPlansInRegions do
  subject(:migration) { described_class.new }

  let(:user) { create(:coplan_user) }
  let(:plan_type) { create(:plan_type, metadata: { described_class::PRESENTATION_MARKER => { "template_content" => "# Legacy" } }) }
  let(:plan) { create(:plan, plan_type: plan_type, created_by_user: user) }

  before { migration.verbose = false }

  it "refuses rollback before schema changes when a migrated presentation was edited" do
    migrated = create(:plan_version, plan: plan, revision: plan.current_revision + 1,
      content_markdown: "::: {.presentation}\n\n# Original\n\n:::", actor_type: "system",
      reason: described_class::MIGRATION_REASON)
    edited = create(:plan_version, plan: plan, revision: migrated.revision + 1,
      content_markdown: "::: {.presentation}\n\n# Edited\n\n:::")
    plan.update_columns(current_plan_version_id: edited.id, current_revision: edited.revision)

    expect(migration).not_to receive(:add_column)
    expect { migration.down }.to raise_error(ActiveRecord::IrreversibleMigration, /incompatible with the legacy renderer/)
  end
end
