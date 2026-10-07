require "rails_helper"

RSpec.describe "Comment ownership actions", type: :system do
  let(:author) { create(:coplan_user, email: "owner@example.com", name: "Comment Owner") }
  let(:other_user) { create(:coplan_user, name: "Other Reviewer") }
  let(:plan) { create(:plan, :considering, created_by_user: author, title: "Comment ownership example") }
  let(:thread_record) { create(:comment_thread, plan: plan, plan_version: plan.current_plan_version, created_by_user: author) }

  [ "light", "dark" ].each do |theme|
    it "deletes only the user's own comments without offering agent edits in #{theme} mode" do
      human = create(:comment, comment_thread: thread_record, author_id: author.id, body_markdown: "My review note")
      agent = create(:comment, comment_thread: thread_record, author_type: "local_agent",
        author_id: author.id, agent_name: "Agent", body_markdown: "My agent's review note")
      others = %w[human local_agent].map do |author_type|
        create(:comment, comment_thread: thread_record, author_type: author_type,
          author_id: other_user.id, agent_name: author_type == "local_agent" ? "Agent" : nil,
          body_markdown: "Another account's #{author_type} note")
      end

      visit sign_in_path
      fill_in "Email address", with: author.email
      click_button "Sign In"
      expect(page).to have_current_path("/owner")
      visit plan_page_path(plan)
      page.execute_script("document.documentElement.dataset.theme = arguments[0]", theme)
      find("#plan-general-comments button").click
      panel = find(".thread-popover", visible: true)

      within(panel.find("[data-comment-id='#{human.id}']")) do
        expect(page).to have_button("Edit", exact: true)
        expect(page).to have_button("Delete", exact: true)
      end
      others.each do |comment|
        within(panel.find("[data-comment-id='#{comment.id}']")) do
          expect(page).to have_no_button("Edit", exact: true)
          expect(page).to have_no_button("Delete", exact: true)
        end
      end
      within(panel.find("[data-comment-id='#{agent.id}']")) do
        expect(page).to have_button("Delete", exact: true)
        expect(page).to have_no_button("Edit", exact: true)
        expect(page).to have_no_css(".comment__editor", visible: :all)
      end
      page.save_screenshot(Rails.root.join("tmp/comment-actions-#{theme}.png"))

      dismiss_confirm("Delete this comment?") do
        panel.find("[data-comment-id='#{agent.id}']").click_button "Delete"
      end
      expect(agent.reload).not_to be_deleted
      accept_confirm("Delete this comment?") do
        panel.find("[data-comment-id='#{agent.id}']").click_button "Delete"
      end
      expect(panel).to have_css("[data-comment-id='#{agent.id}']", text: "Comment deleted")
      expect(agent.reload).to be_deleted
      expect(panel.find("[data-comment-id='#{agent.id}']")).to have_no_button("Delete")
      expect(human.reload).not_to be_deleted
      expect(others.map { |comment| comment.reload.deleted? }).to eq([ false, false ])
      page.save_screenshot(Rails.root.join("tmp/comment-actions-deleted-#{theme}.png"))
    end
  end
end
